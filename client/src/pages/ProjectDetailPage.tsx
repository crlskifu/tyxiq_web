import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Project } from "@shared/schema";
import { Loader2, ArrowLeft, Edit, Trash, ExternalLink, Download, FileIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = parseInt(id);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: () => getQueryFn({ on401: "throw" })(`/api/projects/${projectId}`),
    enabled: !isNaN(projectId)
  });
  
  const isAuthor = user && project && user.id === project.userId;
  const isAdmin = user?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
      toast({
        title: "Проект удален",
        description: "Проект был успешно удален",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate("/projects");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить проект",
        variant: "destructive"
      });
    }
  };
  
  if (isNaN(projectId)) {
    return <div>Неверный ID проекта</div>;
  }
  
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
        ) : project ? (
          <div className="max-w-4xl mx-auto">
            <Card className="glass bg-card bg-opacity-50 shadow-lg overflow-hidden">
              {project.imageUrl && (
                <div className="w-full h-64 overflow-hidden">
                  <img 
                    src={project.imageUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">{project.title}</CardTitle>
                    <CardDescription>
                      {project.createdAt 
                        ? format(new Date(project.createdAt), 'dd.MM.yyyy') 
                        : ''}
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="default" className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Посетить проект
                        </Button>
                      </a>
                    )}
                    
                    {canEdit && (
                      <>
                        <Link href={`/projects/edit/${projectId}`}>
                          <Button variant="outline" className="flex items-center">
                            <Edit className="h-4 w-4 mr-1" />
                            Редактировать
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          className="flex items-center"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Удалить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p>{project.description}</p>
                </div>
                
                {project.files && project.files.length > 0 && (
                  <div className="mt-8">
                    <Separator className="mb-6" />
                    <h3 className="text-lg font-semibold mb-4">Файлы проекта</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.files.map((file, index) => {
                        const fileName = file.split('/').pop() || '';
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                        
                        return (
                          <a 
                            key={index} 
                            href={file} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center p-3 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors"
                          >
                            <div className="flex-shrink-0 mr-3">
                              {isImage ? (
                                <div className="w-12 h-12 rounded overflow-hidden">
                                  <img 
                                    src={file} 
                                    alt={fileName} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center rounded bg-muted">
                                  <FileIcon className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-medium truncate">{fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {isImage ? 'Изображение' : 'Документ'}
                              </p>
                            </div>
                            <Download className="h-4 w-4 flex-shrink-0 ml-2" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Проект не найден</p>
            </CardContent>
          </Card>
        )}
      </main>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass bg-card bg-opacity-70">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект будет удален навсегда.
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