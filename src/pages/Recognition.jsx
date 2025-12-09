import React, { useState, useEffect, useCallback } from "react";
import { Recognition } from "@/entities/Recognition";
import { User } from "@/entities/User";
import {
  Handshake,
  Award,
  Sparkles,
  Trophy,
  Crown,
  Star,
  Heart,
  Zap,
  Target,
  Gift
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRecognition, setNewRecognition] = useState({
    recognized_user_email: "",
    message: "",
    category: ""
  });

  const categories = ["Colaboração", "Inovação", "Esforço Extra", "Atendimento ao Cliente", "Liderança", "Proatividade"];

  const calculateStats = useCallback((recognitionsData, userEmail) => {
    const stats = {
      receivedCount: recognitionsData.filter(r => r.recognized_user_email === userEmail).length,
      givenCount: recognitionsData.filter(r => r.created_by === userEmail).length,
      totalLikes: recognitionsData
        .filter(r => r.recognized_user_email === userEmail)
        .reduce((sum, r) => sum + (r.likes || 0), 0),
      pointsEarned: 0
    };

    stats.pointsEarned = (stats.receivedCount * 10) + (stats.givenCount * 5) + (stats.totalLikes * 2);
    setUserStats(stats);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [currentUserData, recognitionsData, usersData] = await Promise.all([
        User.me(),
        Recognition.list('-created_date'),
        User.list()
      ]);
      setCurrentUser(currentUserData);
      setRecognitions(recognitionsData);
      setUsers(usersData);
      calculateStats(recognitionsData, currentUserData.email);
    } catch (error) {
      console.error("Erro ao carregar dados de reconhecimento:", error);
    }
  }, [calculateStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!newRecognition.recognized_user_email || !newRecognition.message || !newRecognition.category) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await Recognition.create(newRecognition);

      if (currentUser) {
        const latestCurrentUser = await User.me();
        const newPoints = (latestCurrentUser.points || 0) + 5;
        await User.updateMyUserData({ points: newPoints });
      }

      setNewRecognition({ recognized_user_email: "", message: "", category: "" });
      setShowNewDialog(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar reconhecimento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (recognition) => {
    try {
      await Recognition.update(recognition.id, { likes: (recognition.likes || 0) + 1 });
      await loadData();
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  };

  const getUserData = (email) => {
    return users.find(u => u.email === email);
  };

  const getTopRecognized = () => {
    const userRecognitionCounts = {};
    recognitions.forEach(r => {
      const email = r.recognized_user_email;
      userRecognitionCounts[email] = (userRecognitionCounts[email] || 0) + 1;
    });

    return Object.entries(userRecognitionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([email, count]) => ({ email, count, user: getUserData(email) }));
  };

  const getTopGivers = () => {
    const userGivingCounts = {};
    recognitions.forEach(r => {
      const email = r.created_by;
      userGivingCounts[email] = (userGivingCounts[email] || 0) + 1;
    });

    return Object.entries(userGivingCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([email, count]) => ({ email, count, user: getUserData(email) }));
  };

  const RecognitionCard = ({ recognition }) => {
    const recognizedUser = getUserData(recognition.recognized_user_email);
    const recognizingUser = getUserData(recognition.created_by);

    return (
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <Sparkles className="absolute -top-8 -right-8 w-32 h-32 text-yellow-300/20" />
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-14 h-14 border-2 border-white shadow-lg flex-shrink-0">
              <AvatarImage src={recognizedUser?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-bold text-lg">
                {recognizedUser?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">
                    {recognizedUser?.full_name || "Colega"}
                  </h3>
                  <p className="text-white/80 text-sm">{recognizedUser?.position || 'Cargo não definido'}</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-400/90 text-amber-900 px-3 py-1.5 rounded-full font-bold shadow-sm flex-shrink-0">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">+10</span>
                </div>
              </div>
              <Badge className="mt-2 bg-amber-400/20 text-amber-100 border-amber-400/30 font-semibold">
                {recognition.category}
              </Badge>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl mb-4 border border-white/20">
            <p className="text-white italic text-base leading-relaxed">"{recognition.message}"</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80">
              <Avatar className="w-8 h-8">
                <AvatarImage src={recognizingUser?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                  {recognizingUser?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm">
                  Por <strong>{recognizingUser?.full_name || "um colega"}</strong>
                </span>
                <div className="flex items-center gap-1 text-green-300 mt-0.5 font-semibold text-xs">
                  <Zap className="w-3 h-3" />
                  <span>+5 pts</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="lg"
              className="glass-button flex items-center gap-2 px-4"
              onClick={() => handleLike(recognition)}
            >
              <Heart className="w-5 h-5" />
              <span className="font-bold">{recognition.likes || 0}</span>
            </Button>
          </div>
          <p className="text-right text-white/60 mt-3 text-xs">
            {format(new Date(recognition.created_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  };

  const topRecognized = getTopRecognized();
  const topGivers = getTopGivers();

  return (
    <div className="space-y-6">
      {/* Gamificação Header */}
      <div className="glass-card p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">
              🏆 Mural de Reconhecimento
            </h2>
            <p className="text-white/80 text-lg">
              Elogie colegas e ganhe pontos! Transforme o ambiente em um lugar mais positivo.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl mb-2">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{userStats.receivedCount || 0}</div>
              <div className="text-white/70 text-sm">Recebidos</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl mb-2">
                <Handshake className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{userStats.givenCount || 0}</div>
              <div className="text-white/70 text-sm">Dados</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl mb-2">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{userStats.pointsEarned || 0}</div>
              <div className="text-white/70 text-sm">Pontos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Reconhecidos */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Mais Reconhecidos
          </h3>
          <div className="space-y-3">
            {topRecognized.map((item, index) => (
              <div key={item.email} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                  index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white' :
                  'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                }`}>
                  {index + 1}
                </div>
                <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                  <AvatarImage src={item.user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-bold">
                    {item.user?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-white">{item.user?.full_name}</p>
                  <p className="text-white/70 text-sm">{item.count} reconhecimentos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Elogiadores */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-400" />
            Mais Elogiadores
          </h3>
          <div className="space-y-3">
            {topGivers.map((item, index) => (
              <div key={item.email} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${
                  index === 0 ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white' :
                  index === 1 ? 'bg-gradient-to-br from-pink-400 to-pink-600 text-white' :
                  'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                }`}>
                  {index + 1}
                </div>
                <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                  <AvatarImage src={item.user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                    {item.user?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-white">{item.user?.full_name}</p>
                  <p className="text-white/70 text-sm">{item.count} elogios dados</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Feed de Reconhecimento</h2>
            <p className="text-white/70 mt-1">Elogie publicamente os colegas que fizeram a diferença.</p>
          </div>

          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary flex items-center gap-2">
                <Handshake className="w-5 h-5" />
                Reconhecer Colega
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-2xl p-0">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-heading flex items-center gap-3">
                      <Award className="w-6 h-6 text-green-600" />
                      Enviar Reconhecimento
                    </DialogTitle>
                  </div>
                </DialogHeader>
                
                <div className="space-y-5">
                  <div className="info-box">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-blue-600" />
                      <span className="info-box-title">Recompensas Garantidas:</span>
                    </div>
                    <ul className="info-box-text space-y-1">
                      <li>• 5 moedas por elogiar um colega</li>
                      <li>• Seu colega ganha 10 moedas</li>
                      <li>• Reconhecimento público no mural</li>
                    </ul>
                  </div>

                  <div>
                    <Label htmlFor="recognized_user" className="glass-label">Colega a ser reconhecido</Label>
                    <Select
                      value={newRecognition.recognized_user_email}
                      onValueChange={(value) => setNewRecognition(prev => ({ ...prev, recognized_user_email: value }))}
                    >
                      <SelectTrigger className="glass-select h-auto">
                        <SelectValue placeholder="Selecione um colega" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(u => u.email !== currentUser?.email)
                          .map(user => (
                          <SelectItem key={user.id} value={user.email}>{user.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category" className="glass-label">Motivo do reconhecimento</Label>
                    <Select
                      value={newRecognition.category}
                      onValueChange={(value) => setNewRecognition(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="glass-select h-auto">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="glass-label">Mensagem de reconhecimento</Label>
                    <Textarea
                      id="message"
                      placeholder="Conte por que você está reconhecendo esta pessoa..."
                      value={newRecognition.message}
                      onChange={(e) => setNewRecognition(prev => ({ ...prev, message: e.target.value }))}
                      className="glass-textarea"
                      rows={4}
                    />
                    <p className="text-slate-500 mt-2 text-sm">
                      💡 Seja específico sobre o que a pessoa fez de especial
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="ghost" onClick={() => setShowNewDialog(false)} className="glass-button-secondary">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!newRecognition.recognized_user_email || !newRecognition.message || !newRecognition.category || isSubmitting}
                      className="glass-button-primary"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      {isSubmitting ? 'Enviando...' : 'Enviar e Ganhar 5 Moedas'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Feed de Reconhecimentos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recognitions.map(rec => (
          <RecognitionCard key={rec.id} recognition={rec} />
        ))}
      </div>

      {recognitions.length === 0 && (
         <div className="text-center py-16 glass-card rounded-2xl">
            <Award className="w-20 h-20 text-white/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">O mural ainda está vazio</h3>
            <p className="text-white/70 mb-6 text-lg">
              Seja o primeiro a reconhecer um colega e ganhe 5 moedas!
            </p>
            <Button onClick={() => setShowNewDialog(true)} className="glass-button-primary">
              <Handshake className="w-5 h-5 mr-2" />
              Fazer Primeiro Reconhecimento
            </Button>
          </div>
      )}
    </div>
  );
}