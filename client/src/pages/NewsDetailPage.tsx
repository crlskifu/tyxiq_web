import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { News } from "@shared/schema";
import { Loader2, ArrowLeft, Edit, Trash, FileIcon, Download, Image } from "lucide-react";
import { format } from "date-fns";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function NewsDetailPage() {
  const { id } = useParams();
  const newsId = parseInt(id || "0");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: news, isLoading, error } = useQuery({
    queryKey: ["/api/news", newsId],
    queryFn: () => getQueryFn<News>({ on401: "throw" })(`/api/news/${newsId}`),
    enabled: !isNaN(newsId)
  });
  
  const isAuthor = user && news && user.id === news.userId;
  const isAdmin = user?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/news/${newsId}`);
      toast({
        title: "Новость удалена",
        description: "Новость была успешно удалена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      navigate("/news");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить новость",
        variant: "destructive"
      });
    }
  };
  
  if (isNaN(newsId)) {
    return <div>Неверный ID новости</div>;
  }
  
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
        ) : news ? (
          <div className="max-w-3xl mx-auto">
            <Card className="glass bg-card bg-opacity-50 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">{news.title}</CardTitle>
                    <CardDescription>
                      {news.createdAt 
                        ? format(new Date(news.createdAt), 'dd.MM.yyyy HH:mm') 
                        : ''}
                    </CardDescription>
                  </div>
                  
                  {canEdit && (
                    <div className="flex space-x-2">
                      <Link href={`/news/edit/${newsId}`}>
                        <Button size="sm" variant="outline" className="flex items-center">
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="flex items-center"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p>{news.content}</p>
                </div>
              </CardContent>
              
              {news.files && news.files.length > 0 && (
                <CardFooter className="flex-col items-start">
                  <h3 className="text-base font-medium mb-2">Прикрепленные файлы:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    {news.files.map((file: string, index: number) => {
                      const fileName = file.split('/').pop() || '';
                      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                      
                      return (
                        <div key={index} className="flex items-center justify-between bg-secondary/20 p-2 rounded">
                          <div className="flex items-center truncate">
                            {isImage ? (
                              <Image className="h-4 w-4 mr-2" />
                            ) : (
                              <FileIcon className="h-4 w-4 mr-2" />
                            )}
                            <span className="text-sm truncate max-w-[150px]">
                              {fileName}
                            </span>
                          </div>
                          <a 
                            href={file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2"
                          >
                            {isImage ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                              >
                                Просмотр
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Скачать
                              </Button>
                            )}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        ) : (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Новость не найдена</p>
            </CardContent>
          </Card>
        )}
      </main>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass bg-card bg-opacity-70">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Новость будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}