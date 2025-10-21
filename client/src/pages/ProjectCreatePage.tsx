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
import { useLocation, Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useRef } from "react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, X, FileIcon } from "lucide-react";

// Схема для формы создания проекта
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

export default function ProjectCreatePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Значения по умолчанию
  const defaultValues: Partial<ProjectFormValues> = {
    title: "",
    description: "",
    url: "",
    imageUrl: "",
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });
  
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
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания проектов",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const projectData = {
        ...data,
        userId: user.id,
        files: uploadedFiles
      };
      
      const response = await apiRequest("POST", "/api/projects", projectData);
      const createdProject = await response.json();
      
      toast({
        title: "Проект создан",
        description: "Ваш проект был успешно опубликован",
      });
      
      // Обновляем кеш проектов
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Переходим на страницу созданного проекта
      navigate(`/projects/${createdProject.id}`);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать проект",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" className="flex items-center p-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к проектам
            </Button>
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardHeader>
              <CardTitle>Добавить проект</CardTitle>
              <CardDescription>
                Поделитесь вашим проектом с сообществом
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
                  
                  {user?.role === 'admin' && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-medium">Прикрепить файлы</h3>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isFileUploading}
                            className="h-8"
                          >
                            {isFileUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Выбрать файлы
                          </Button>
                          <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isFileUploading}
                          />
                        </div>
                        
                        {/* Превью загруженных файлов */}
                        {uploadedFiles.length > 0 && (
                          <div className="bg-secondary/20 rounded-lg p-3 mb-4">
                            <h4 className="text-sm font-medium mb-2">Загруженные файлы:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {uploadedFiles.map((file, index) => {
                                const fileName = file.split('/').pop() || '';
                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                                
                                return (
                                  <div key={index} className="flex items-center justify-between bg-background p-2 rounded">
                                    <div className="flex items-center">
                                      {isImage ? (
                                        <img src={file} alt={fileName} className="h-8 w-8 object-cover rounded mr-2" />
                                      ) : (
                                        <FileIcon className="h-4 w-4 mr-2" />
                                      )}
                                      <span className="text-sm truncate max-w-[150px]">
                                        {fileName}
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => removeFile(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={form.formState.isSubmitting || isUploading || isFileUploading}
                  >
                    {(form.formState.isSubmitting || isUploading || isFileUploading) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Опубликовать проект
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}