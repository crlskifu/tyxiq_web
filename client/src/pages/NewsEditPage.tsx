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
} from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { News } from "@shared/schema";

// Схема для формы редактирования новости
const newsFormSchema = z.object({
  title: z.string()
    .min(3, { message: "Заголовок должен содержать не менее 3 символов" })
    .max(100, { message: "Заголовок должен содержать не более 100 символов" }),
  content: z.string()
    .min(10, { message: "Содержание должно содержать не менее 10 символов" })
    .max(5000, { message: "Содержание должно содержать не более 5000 символов" }),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

export default function NewsEditPage() {
  const { id } = useParams();
  const newsId = parseInt(id);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Получаем данные новости
  const { 
    data: news, 
    isLoading, 
    error 
  } = useQuery<News>({
    queryKey: ["/api/news", newsId],
    queryFn: () => getQueryFn({ on401: "throw" })(`/api/news/${newsId}`),
    enabled: !isNaN(newsId)
  });
  
  // Значения по умолчанию
  const defaultValues: NewsFormValues = {
    title: "",
    content: "",
  };

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues,
  });
  
  // Заполняем форму данными при загрузке новости
  useEffect(() => {
    if (news) {
      form.reset({
        title: news.title,
        content: news.content,
      });
    }
  }, [news, form]);
  
  // Проверяем, имеет ли пользователь право на редактирование
  const isAuthor = user && news && user.id === news.userId;
  const isAdmin = user?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  
  // Обработчик отправки формы
  const onSubmit = async (data: NewsFormValues) => {
    if (!user || !canEdit) {
      toast({
        title: "Ошибка",
        description: "У вас нет прав на редактирование этой новости",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest("PUT", `/api/news/${newsId}`, data);
      const updatedNews = await response.json();
      
      toast({
        title: "Новость обновлена",
        description: "Ваша новость была успешно обновлена",
      });
      
      // Обновляем кеш новостей
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news", newsId] });
      
      // Переходим на страницу новости
      navigate(`/news/${newsId}`);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить новость",
        variant: "destructive",
      });
    }
  };
  
  if (isNaN(newsId)) {
    return <div>Неверный ID новости</div>;
  }
  
  // Если пользователь не автор и не админ, перенаправляем
  if (news && user && !canEdit) {
    navigate("/news");
    toast({
      title: "Доступ запрещен",
      description: "У вас нет прав на редактирование этой новости",
      variant: "destructive",
    });
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/news/${newsId}`}>
            <Button variant="ghost" className="flex items-center p-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к новости
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
              <p className="text-destructive">Ошибка загрузки новости: {error.message}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto">
            <Card className="glass bg-card bg-opacity-50 shadow-lg">
              <CardHeader>
                <CardTitle>Редактировать новость</CardTitle>
                <CardDescription>
                  Внесите изменения в вашу новость
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
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={form.formState.isSubmitting}
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