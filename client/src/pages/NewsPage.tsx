import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { News } from "@shared/schema";
import { Loader2, Plus, Edit, Trash } from "lucide-react";
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
import { format } from "date-fns";

export default function NewsPage() {
  const { user } = useAuth();
  
  const { data: news, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Новости</h1>
          {user?.role === "admin" && (
            <Link href="/news/create">
              <Button className="glass bg-card bg-opacity-50 hover:bg-opacity-70">
                <Plus className="mr-2 h-4 w-4" /> Создать новость
              </Button>
            </Link>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-destructive">Ошибка загрузки новостей: {error.message}</p>
            </CardContent>
          </Card>
        ) : news && news.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        ) : (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Новостей пока нет. Будьте первым, кто опубликует новость!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function NewsCard({ news }: { news: News }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const formattedDate = news.createdAt 
    ? format(new Date(news.createdAt), 'dd.MM.yyyy HH:mm') 
    : '';
  
  const isAdmin = user?.role === "admin";
  
  // Обработчик удаления новости
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/news/${news.id}`);
      toast({
        title: "Новость удалена",
        description: "Новость была успешно удалена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить новость",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  return (
    <>
      <Card className="glass bg-card bg-opacity-50 hover:bg-opacity-70 transition-all shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{news.title}</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
            
            {isAdmin && (
              <div className="flex space-x-1">
                <Link href={`/news/edit/${news.id}`}>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3">{news.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/news/${news.id}`}>
            <Button variant="link" className="p-0">Читать далее</Button>
          </Link>
        </CardFooter>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass bg-card bg-opacity-70">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Новость "{news.title}" будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}