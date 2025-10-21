import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
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
import { Loader2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Форма профиля
const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Имя пользователя должно содержать не менее 3 символов",
  }),
  bio: z.string().max(500, {
    message: "Биография должна содержать не более 500 символов",
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [searchParams] = useLocation();
  const params = new URLSearchParams(searchParams);
  const initialTab = params.get("tab") || "profile";
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Значения по умолчанию из профиля пользователя
  const defaultValues: Partial<ProfileFormValues> = {
    username: user?.username || "",
    bio: user?.bio || "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });
  
  // Обработчик отправки формы
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedUser = await apiRequest("PUT", "/api/users/profile", data);
      const result = await updatedUser.json();
      
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль был успешно обновлен",
      });
      
      // Обновляем данные пользователя в кеше
      queryClient.setQueryData(["/api/user"], result);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };
  
  // Обработчик загрузки аватара
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Здесь будет имитация загрузки файла (в реальном проекте - отправка на сервер)
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        // В реальном приложении здесь будет отправка файла на сервер
        // и получение URL загруженного изображения
        const dataUrl = event.target.result.toString();
        setAvatarPreview(dataUrl);
        
        try {
          // Здесь должен быть запрос к API, который загружает аватар
          // Сейчас просто обновляем профиль с dataUrl в качестве аватара
          const response = await apiRequest("PUT", "/api/users/profile", {
            avatar: dataUrl
          });
          const result = await response.json();
          
          queryClient.setQueryData(["/api/user"], result);
          
          toast({
            title: "Аватар обновлен",
            description: "Ваш аватар был успешно обновлен",
          });
        } catch (error) {
          toast({
            title: "Ошибка",
            description: error instanceof Error ? error.message : "Не удалось загрузить аватар",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-8">Мой профиль</h1>
          
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card bg-opacity-50">
              <TabsTrigger value="profile">Профиль</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>
            
            {/* Вкладка профиля */}
            <TabsContent value="profile">
              <Card className="glass bg-card bg-opacity-50 mt-6">
                <CardHeader>
                  <CardTitle>Ваш профиль</CardTitle>
                  <CardDescription>
                    Здесь вы можете обновить информацию о себе, которую увидят другие пользователи.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Загрузка аватара */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={avatarPreview || undefined} alt={user?.username || "Avatar"} />
                          <AvatarFallback className="text-lg">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                          {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-full">
                              <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                          )}
                        </Avatar>
                        <label 
                          htmlFor="avatar-upload" 
                          className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg"
                        >
                          <Camera className="h-5 w-5" />
                          <span className="sr-only">Изменить аватар</span>
                        </label>
                        <input 
                          type="file" 
                          id="avatar-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleAvatarChange}
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                    
                    {/* Форма профиля */}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя пользователя</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ваше имя пользователя" 
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
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>О себе</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Расскажите о себе..."
                                  className="resize-none bg-input"
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Вкладка настроек */}
            <TabsContent value="settings">
              <Card className="glass bg-card bg-opacity-50 mt-6">
                <CardHeader>
                  <CardTitle>Настройки аккаунта</CardTitle>
                  <CardDescription>
                    Управляйте настройками вашего аккаунта.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Настройки аккаунта будут добавлены в ближайшее время.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}