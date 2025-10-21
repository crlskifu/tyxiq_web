import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

type UserData = {
  id: number;
  username: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string | null;
};

export default function UsersPage() {
  const { data: users, isLoading, error } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold gradient-text mb-8">Пользователи</h1>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-destructive">Ошибка загрузки пользователей: {error.message}</p>
            </CardContent>
          </Card>
        ) : users && users.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <Card className="glass bg-card bg-opacity-50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Пользователей пока нет.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function UserCard({ user }: { user: UserData }) {
  const formattedDate = user.createdAt 
    ? format(new Date(user.createdAt), 'dd.MM.yyyy') 
    : '';
  
  const shortBio = user.bio && user.bio.length > 100 
    ? user.bio.substring(0, 100) + '...' 
    : user.bio;
  
  return (
    <Card className="glass bg-card bg-opacity-50 hover:bg-opacity-70 transition-all shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-start space-x-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar || undefined} alt={user.username} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{user.username}</CardTitle>
          <CardDescription>
            Регистрация: {formattedDate}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {shortBio ? (
          <p className="text-sm text-muted-foreground">{shortBio}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">У пользователя нет описания.</p>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-card bg-opacity-50">
            <Link href={`/user/${user.id}/projects`} className="hover:underline">
              Проекты
            </Link>
          </Badge>
          <Badge variant="outline" className="bg-card bg-opacity-50">
            <Link href={`/user/${user.id}/news`} className="hover:underline">
              Новости
            </Link>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}