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
import { useLocation } from "wouter";
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
} from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, X, FileIcon } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef } from "react";

// Схема для формы создания новости
const newsFormSchema = z.object({
  title: z.string()
    .min(3, { message: "Заголовок должен содержать не менее 3 символов" })
    .max(100, { message: "Заголовок должен содержать не более 100 символов" }),
  content: z.string()
    .min(10, { message: "Содержание должно содержать не менее 10 символов" })
    .max(5000, { message: "Содержание должно содержать не более 5000 символов" }),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

export default function NewsCreatePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Состояние для управления загруженными файлами
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  
  // Значения по умолчанию
  const defaultValues: Partial<NewsFormValues> = {
    title: "",
    content: "",
  };

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues,
  });
  
  // Обработчик выбора файлов
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setLocalFiles(prev => [...prev, ...selectedFiles]);
    
    if (user?.role !== 'admin') {
      toast({
        title: "Ошибка доступа",
        description: "Только администраторы могут загружать файлы",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
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
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Удаление файла
  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
    setLocalFiles(files => files.filter((_, i) => i !== index));
  };
  
  // Обработчик отправки формы
  const onSubmit = async (data: NewsFormValues) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания новостей",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newsData = {
        ...data,
        userId: user.id,
        files: uploadedFiles
      };
      
      const response = await apiRequest("POST", "/api/news", newsData);
      const createdNews = await response.json();
      
      toast({
        title: "Новость создана",
        description: "Ваша новость была успешно опубликована",
      });
      
      // Обновляем кеш новостей
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      
      // Переходим на страницу созданной новости
      navigate(`/news/${createdNews.id}`);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать новость",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/news">
            <Button variant="ghost" className="flex items-center p-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к новостям
            </Button>
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardHeader>
              <CardTitle>Создать новость</CardTitle>
              <CardDescription>
                Поделитесь важной информацией с сообществом
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
                        <FormLabel>Заголовок</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Введите заголовок новости" 
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
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Содержание</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Введите содержание новости..."
                            className="resize-vertical min-h-[200px] bg-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {user?.role === 'admin' && (
                    <div>
                      <div className="flex items-center mb-2">
                        <FormLabel className="mb-0 mr-2">Прикрепить файлы</FormLabel>
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="h-8"
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          Выбрать файлы
                        </Button>
                      </div>

                      {/* Превью загруженных файлов */}
                      {uploadedFiles.length > 0 && (
                        <div className="bg-secondary/20 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium mb-2">Загруженные файлы:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-background p-2 rounded">
                                <div className="flex items-center">
                                  <FileIcon className="h-4 w-4 mr-2" />
                                  <span className="text-sm truncate max-w-[150px]">
                                    {file.split('/').pop()}
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
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={form.formState.isSubmitting || isUploading}
                  >
                    {(form.formState.isSubmitting || isUploading) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Опубликовать новость
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