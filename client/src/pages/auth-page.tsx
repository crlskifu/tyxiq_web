import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Расширяем схему для валидации формы
const formSchema = insertUserSchema.extend({
  password: z
    .string()
    .min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string().optional(),
  adminCode: z.string().optional(),
}).superRefine((data, ctx) => {
  // Только для формы регистрации проверяем совпадение паролей
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Пароли не совпадают",
      path: ["confirmPassword"],
    });
  }
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation } = useAuth();

  // Создаем форму
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      adminCode: "",
    },
    // Сбрасываем ошибки, когда переключаемся между вкладками
    mode: "onChange"
  });

  // Обработчик отправки формы
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (activeTab === "login") {
      // Проверяем код администратора при входе
      const isAdmin = values.adminCode === "MSQ$42?_дима+микото=любовь";
      
      // Если введен код, пытаемся войти как админ
      // Сервер сам проверит, действительно ли пользователь админ
      loginMutation.mutate({
        username: values.username,
        password: values.password,
        role: isAdmin ? "admin" : "user" // Передаем роль серверу для проверки
      });
    } else {
      // Проверяем код администратора при регистрации
      const isAdmin = values.adminCode === "MSQ$42?_дима+микото=любовь";
      
      registerMutation.mutate({
        username: values.username,
        password: values.password,
        role: isAdmin ? "admin" : "user"
      });
    }
  }

  // Если пользователь авторизован, перенаправляем на главную
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Форма авторизации */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="accent-border bg-card bg-opacity-70 glass shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-heading">
                {activeTab === "login" ? "Вход" : "Регистрация"}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === "login"
                  ? "Войдите в свою учетную запись"
                  : "Создайте новую учетную запись"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={activeTab} 
                onValueChange={(v) => setActiveTab(v as "login" | "register")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 mb-8">
                  <TabsTrigger value="login">Вход</TabsTrigger>
                  <TabsTrigger value="register">Регистрация</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Код администратора (необязательно)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Для входа с правами администратора" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-6"
                        disabled={loginMutation.isPending}
                        style={{ background: "var(--accent-gradient)" }}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Войти
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Подтверждение пароля</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Код администратора (необязательно)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Для получения прав администратора" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-6"
                        disabled={registerMutation.isPending}
                        style={{ background: "var(--accent-gradient)" }}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Зарегистрироваться
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center text-sm opacity-75">
              {activeTab === "login" ? (
                <p>Нет аккаунта? <span 
                  className="cursor-pointer underline" 
                  onClick={() => setActiveTab("register")}
                >Зарегистрируйтесь</span>
                </p>
              ) : (
                <p>Уже есть аккаунт? <span 
                  className="cursor-pointer underline" 
                  onClick={() => setActiveTab("login")}
                >Войти</span>
                </p>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Информационная панель */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl font-heading font-bold mb-6">
              <span className="gradient-text">Tyxiq.web</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Исследуйте наш цифровой мир с передовыми технологиями и инновационными решениями
            </p>
            <div className="flex flex-wrap justify-center gap-4 my-8">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="accent-border bg-card bg-opacity-30 glass p-4 rounded-lg w-28 h-28 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold gradient-text">{i}0+</div>
                    <div className="text-xs mt-2 text-gray-400">
                      {i === 1 ? "Проектов" : i === 2 ? "Клиентов" : "Наград"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}