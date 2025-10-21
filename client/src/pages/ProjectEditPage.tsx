import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, X, FileIcon } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Project } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

// Схема для формы редактирования проекта
const projectFormSchema = z.object({
  title: z.string()
    .min(3, { message: "Название должно содержать не менее 3 символов" })
    .max(100, { message: "Название должно содержать не более 100 символов" }),
  description: z.string()
    .min(10, { message: "Описание должно содержать не менее 10 символов" })
    .max(5000, { message: "Описание должно содержать не более 5000 символов" }),
  url: z.string().url({ message: "Укажите корректный URL" }).optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function ProjectEditPage() {
  const { id } = useParams();
  const projectId = parseInt(id);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Получаем данные проекта
  const { 
    data: project, 
    isLoading, 
    error 
  } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: () => getQueryFn({ on401: "throw" })(`/api/projects/${projectId}`),
    enabled: !isNaN(projectId)
  });
  
  // Значения по умолчанию
  const defaultValues: ProjectFormValues = {
    title: "",
    description: "",
    url: "",
    imageUrl: "",
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });
  
  // Заполняем форму данными при загрузке проекта
  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        description: project.description,
        url: project.url || "",
        imageUrl: project.imageUrl,
      });
      
      if (project.imageUrl) {
        setPreviewImage(project.imageUrl);
      }
      
      if (project.files) {
        setUploadedFiles(project.files);
      }
    }
  }, [project, form]);
  
  // Проверяем, имеет ли пользователь право на редактирование
  const isAuthor = user && project && user.id === project.userId;
  const isAdmin = user?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  
  // Обработчик загрузки изображения
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Загружаем файл на сервер
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }
      
      const result = await response.json();
      // Используем первый загруженный файл как imageUrl
      if (result.files && result.files.length > 0) {
        const imageUrl = result.files[0];
        setPreviewImage(imageUrl);
        form.setValue("imageUrl", imageUrl);
      }
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить изображение",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Обработчик загрузки файлов
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    if (user?.role !== 'admin') {
      toast({
        title: "Ошибка доступа",
        description: "Только администраторы могут загружать файлы",
        variant: "destructive",
      });
      return;
    }
    
    setIsFileUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки файлов');
      }
      
      const result = await response.json();
      setUploadedFiles(prev => [...prev, ...result.files]);
      
      toast({
        title: "Файлы загружены",
        description: `Успешно загружено ${result.files.length} файлов`,
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить файлы",
        variant: "destructive",
      });
    } finally {
      setIsFileUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Удаление файла
  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };
  
  // Обработчик отправки формы
  const onSubmit = async (data: ProjectFormValues) => {
    if (!user || !canEdit) {
      toast({
        title: "Ошибка",
        description: "У вас нет прав на редактирование этого проекта",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Добавляем загруженные файлы к данным проекта
      const projectData = {
        ...data,
        files: uploadedFiles,
      };
      
      const response = await apiRequest("PUT", `/api/projects/${projectId}`, projectData);
      const updatedProject = await response.json();
      
      toast({
        title: "Проект обновлен",
        description: "Ваш проект был успешно обновлен",
      });
      
      // Обновляем кеш проектов
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      
      // Переходим на страницу проекта
      navigate(`/projects/${projectId}`);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить проект",
        variant: "destructive",
      });
    }
  };
  
  if (isNaN(projectId)) {
    return <div>Неверный ID проекта</div>;
  }
  
  // Если пользователь не автор и не админ, перенаправляем
  if (project && user && !canEdit) {
    navigate("/projects");
    toast({
      title: "Доступ запрещен",
      description: "У вас нет прав на редактирование этого проекта",
      variant: "destructive",
    });
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" className="flex items-center p-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к проекту
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-destructive">Ошибка загрузки проекта: {error.message}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto">
            <Card className="glass bg-card bg-opacity-50 shadow-lg">
              <CardHeader>
                <CardTitle>Редактировать проект</CardTitle>
                <CardDescription>
                  Внесите изменения в ваш проект
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название проекта</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Введите название проекта" 
                              className="bg-input" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Введите описание проекта..."
                              className="resize-vertical min-h-[200px] bg-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL проекта</FormLabel>
                          <FormControl>
                            <Input 
                              type="url"
                              placeholder="https://example.com" 
                              className="bg-input" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Укажите ссылку на ваш проект, если она доступна
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Изображение проекта</FormLabel>
                          <div className="space-y-4">
                            {previewImage && (
                              <div className="rounded-md overflow-hidden w-full max-h-60">
                                <img 
                                  src={previewImage} 
                                  alt="Preview" 
                                  className="w-full h-auto object-cover"
                                />
                              </div>
                            )}
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Input 
                                  type="hidden"
                                  {...field} 
                                />
                                <label 
                                  htmlFor="project-image-upload" 
                                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md cursor-pointer ${
                                    isUploading 
                                      ? "bg-muted text-muted-foreground" 
                                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                                  }`}
                                >
                                  {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  {previewImage ? "Изменить изображение" : "Загрузить изображение"}
                                </label>
                                <input 
                                  type="file" 
                                  id="project-image-upload" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={isUploading}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Добавьте скриншот или изображение, представляющее ваш проект. Рекомендуемое соотношение сторон 16:9.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {isAdmin && (
                      <div className="space-y-4 mt-8">
                        <div className="flex flex-col space-y-2">
                          <h3 className="text-lg font-medium">Файлы проекта</h3>
                          <p className="text-sm text-muted-foreground">
                            Добавьте документы, презентации и другие файлы к проекту
                          </p>
                          
                          {/* Кнопка загрузки файлов */}
                          <div className="flex items-center gap-4 mt-2">
                            <label 
                              htmlFor="project-files-upload" 
                              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md cursor-pointer ${
                                isFileUploading 
                                  ? "bg-muted text-muted-foreground" 
                                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                              }`}
                            >
                              {isFileUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Загрузить файлы
                            </label>
                            <input 
                              type="file" 
                              id="project-files-upload" 
                              className="hidden" 
                              multiple
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              disabled={isFileUploading}
                            />
                          </div>
                        </div>
                        
                        {/* Список загруженных файлов */}
                        {uploadedFiles.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Загруженные файлы:</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-card/50">
                              {uploadedFiles.map((file, index) => {
                                const fileName = file.split('/').pop() || 'файл';
                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
                                
                                return (
                                  <div 
                                    key={`file-${index}`} 
                                    className="flex items-center justify-between p-2 rounded-md bg-card/80 hover:bg-card/90"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      {isImage ? (
                                        <img 
                                          src={file} 
                                          alt={fileName} 
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      ) : (
                                        <FileIcon className="w-5 h-5 text-primary" />
                                      )}
                                      <a 
                                        href={file} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="truncate text-sm hover:underline"
                                      >
                                        {fileName}
                                      </a>
                                    </div>
                                    
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeFile(index)}
                                      type="button"
                                    >
                                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Separator className="my-6" />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={form.formState.isSubmitting || isUploading || isFileUploading}
                    >
                      {form.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Сохранить изменения
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}