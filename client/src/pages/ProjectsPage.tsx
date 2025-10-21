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
import { Project } from "@shared/schema";
import { Loader2, Plus, ExternalLink, Edit, Trash } from "lucide-react";
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

export default function ProjectsPage() {
  const { user } = useAuth();
  
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Проекты</h1>
          {user?.role === "admin" && (
            <Link href="/projects/create">
              <Button className="glass bg-card bg-opacity-50 hover:bg-opacity-70">
                <Plus className="mr-2 h-4 w-4" /> Добавить проект
              </Button>
            </Link>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-destructive">Ошибка загрузки проектов: {error.message}</p>
            </CardContent>
          </Card>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Проектов пока нет. Будьте первым, кто добавит проект!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const formattedDate = project.createdAt 
    ? format(new Date(project.createdAt), 'dd.MM.yyyy') 
    : '';
  
  const isAdmin = user?.role === "admin";
  
  // Обработчик удаления проекта
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/projects/${project.id}`);
      toast({
        title: "Проект удален",
        description: "Проект был успешно удален",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить проект",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  return (
    <>
      <Card className="glass bg-card bg-opacity-50 hover:bg-opacity-70 transition-all shadow-lg overflow-hidden h-full flex flex-col">
        {project.imageUrl && (
          <div className="w-full h-48 overflow-hidden">
            <img 
              src={project.imageUrl} 
              alt={project.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
            
            {isAdmin && (
              <div className="flex space-x-1">
                <Link href={`/projects/edit/${project.id}`}>
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
        <CardContent className="flex-grow">
          <p className="line-clamp-3">{project.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/projects/${project.id}`}>
            <Button variant="link" className="p-0">Подробнее</Button>
          </Link>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="flex items-center" >
                <ExternalLink className="h-4 w-4 mr-1" />
                Посетить
              </Button>
            </a>
          )}
        </CardFooter>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass bg-card bg-opacity-70">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект "{project.title}" будет удален навсегда.
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