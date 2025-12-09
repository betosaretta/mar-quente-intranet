import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  Home,
  MessageSquare,
  FileText,
  Users,
  Award,
  Settings,
  Bell,
  User as UserIcon,
  LogOut,
  Crown,
  Phone,
  Shield,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Lightbulb,
  MessagesSquare,
  ClipboardCheck,
  BookOpen,
  Calendar
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserProfile from "@/components/UserProfile";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [notifications] = useState(3);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  // Detectar se é acesso via link público de formulário
  const isPublicFormAccess = () => {
    // Check for window to avoid SSR issues if this component is rendered on the server
    if (typeof window === 'undefined') {
      return false;
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('form');
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Aplicar classe no body para uso global
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      setUser(null); // Set to null if fails to ensure filtering works
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navigationItems = [
    { title: "Home", url: createPageUrl("Dashboard"), icon: Home },
    { title: "Mural", url: createPageUrl("Announcements"), icon: MessageSquare },
    { title: "Mensagens", url: createPageUrl("Messaging"), icon: MessagesSquare },
    { title: "RH", url: createPageUrl("HRRequests"), icon: FileText },
    { title: "Cursos", url: createPageUrl("Contents"), icon: Users },
    { title: "Manuais", url: createPageUrl("Manuals"), icon: BookOpen },
    { title: "Contatos", url: createPageUrl("Contacts"), icon: Phone },
    { title: "Avaliações", url: createPageUrl("PerformanceReviews"), icon: ClipboardCheck },
    { title: "Envie Sua Melhoria", url: createPageUrl("Suggestions"), icon: Sparkles },
    { title: "Denúncia Anônima", url: createPageUrl("AnonymousComplaint"), icon: Shield },
    // Admin/RH only items
    { title: "MQ News", url: createPageUrl("MQNews"), icon: Award, requiresPermission: true },
    { title: "Formulários", url: createPageUrl("CustomForms"), icon: Lightbulb, requiresPermission: true },
    { title: "Gestão de Férias", url: createPageUrl("VacationManagement"), icon: Calendar, requiresPermission: true },
    { title: "Recrutamento", url: createPageUrl("RecruitmentKanban"), icon: Users, requiresPermission: true },
  ];

  // Filter navigation items based on user permissions
  const getFilteredNavigationItems = () => {
    if (!user) {
      // If user not loaded yet, show all items without requiresPermission
      return navigationItems.filter(item => !item.requiresPermission);
    }
    
    return navigationItems.filter(item => {
      // Show all items without permission requirements
      if (!item.requiresPermission) return true;
      
      // For items requiring permission, check if user is admin or RH
      return user.role === 'admin' || user.department === 'RH';
    });
  };

  const filteredNavigationItems = getFilteredNavigationItems();

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Se for acesso público ao formulário, não mostrar layout
  if (isPublicFormAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"></div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        /* Dark Mode Styles */
        .dark-mode .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        
        .dark-mode .glass-strong {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        
        .dark-mode .glass-card {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dark-mode .glass-card:hover {
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 12px 40px 0 rgba(31, 38, 135, 0.45),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
          transform: translateY(-2px);
        }
        
        .dark-mode .text-glass { color: white; }
        .dark-mode .glass-text { color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .dark-mode .glass-text-muted { color: rgba(255, 255, 255, 0.85); }
        
        /* Light Mode Styles */
        .light-mode .glass {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
        }
        
        .light-mode .glass-strong {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
        }
        
        .light-mode .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .light-mode .glass-card:hover {
          background: rgba(255, 255, 255, 1);
          border: 1px solid rgba(203, 213, 225, 0.9);
          box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }
        
        .light-mode .text-glass { color: #1e293b; }
        .light-mode .glass-text { color: #0f172a; font-weight: 600; }
        .light-mode .glass-text-muted { color: #475569; }
        
        /* Modal Styles - Responsivo */
        .glass-modal {
          background: #ffffff !important;
          border: 3px solid #e2e8f0 !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          border-radius: 20px !important;
        }

        /* CRITICAL: Força cores escuras em TODOS os textos dentro de modais */
        .glass-modal .glass-text,
        .glass-modal .text-glass,
        .glass-modal span,
        .glass-modal p,
        .glass-modal label,
        .glass-modal div {
          color: #0f172a !important;
        }

        .glass-modal .glass-text-muted {
          color: #475569 !important;
        }

        .glass-modal .glass-label {
          color: #000000 !important;
        }

        /* Garantir que inputs, selects e textareas tenham texto escuro */
        .glass-modal input,
        .glass-modal textarea,
        .glass-modal select {
          color: #000000 !important;
        }

        /* Mobile: Modal ocupa tela toda */
        @media (max-width: 768px) {
          .glass-modal {
            position: fixed !important;
            inset: 0 !important;
            max-width: 100% !important;
            max-height: 100% !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            transform: none !important;
          }

          /* Conteúdo do modal scrollable em mobile */
          .glass-modal > div {
            max-height: 100vh !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          /* Header fixo no topo em mobile */
          .modal-header-mobile {
            position: sticky !important;
            top: 0 !important;
            z-index: 10 !important;
            background: #ffffff !important;
            border-bottom: 2px solid #e2e8f0 !important;
            padding: 16px 20px !important;
            margin: 0 -20px 20px -20px !important;
          }

          /* Footer fixo no bottom em mobile */
          .modal-footer-mobile {
            position: sticky !important;
            bottom: 0 !important;
            z-index: 10 !important;
            background: #ffffff !important;
            border-top: 2px solid #e2e8f0 !important;
            padding: 16px 20px !important;
            margin: 20px -20px 0 -20px !important;
          }

          /* Ajustar padding do conteúdo do modal */
          .glass-modal .p-8 {
            padding: 20px !important;
          }

          /* Botões mobile maiores e mais espaçados */
          .mobile-button {
            min-height: 52px !important;
            font-size: 17px !important;
            font-weight: 700 !important;
            padding: 14px 24px !important;
            touch-action: manipulation !important;
          }
        }
        
        /* Input Styles - Universal com melhorias mobile */
        .glass-input {
          background: #ffffff !important;
          border: 2px solid #cbd5e1 !important;
          color: #000000 !important;
          font-size: 17px !important;
          font-weight: 600 !important;
          padding: 16px 18px !important;
          border-radius: 10px !important;
          transition: all 0.2s ease;
          width: 100%;
          line-height: 1.5 !important;
        }

        @media (max-width: 768px) {
          .glass-input {
            font-size: 18px !important;
            padding: 18px 20px !important;
            min-height: 56px !important;
          }
        }
        
        .glass-input::placeholder {
          color: #64748b !important;
          font-weight: 500 !important;
        }
        
        .glass-input:focus {
          background: #ffffff !important;
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
        }
        
        .glass-input:disabled {
          background: #f1f5f9 !important;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        /* Textarea Styles - Universal com melhorias mobile */
        .glass-textarea {
          background: #ffffff !important;
          border: 2px solid #cbd5e1 !important;
          color: #000000 !important;
          font-size: 17px !important;
          font-weight: 600 !important;
          padding: 16px 18px !important;
          border-radius: 10px !important;
          transition: all 0.2s ease;
          resize: none;
          min-height: 140px !important;
          width: 100%;
          line-height: 1.6 !important;
        }

        @media (max-width: 768px) {
          .glass-textarea {
            font-size: 18px !important;
            padding: 18px 20px !important;
            min-height: 160px !important;
          }
        }
        
        .glass-textarea::placeholder {
          color: #64748b !important;
          font-weight: 500 !important;
        }
        
        .glass-textarea:focus {
          background: #ffffff !important;
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
        }
        
        /* Select Styles - Universal com melhorias mobile */
        .glass-select {
          background: #ffffff !important;
          border: 2px solid #cbd5e1 !important;
          color: #000000 !important;
          font-size: 17px !important;
          font-weight: 600 !important;
          padding: 16px 18px !important;
          border-radius: 10px !important;
          transition: all 0.2s ease;
        }

        @media (max-width: 768px) {
          .glass-select {
            font-size: 18px !important;
            padding: 18px 20px !important;
            min-height: 56px !important;
          }
        }
        
        .glass-select:focus {
          background: #ffffff !important;
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
        }
        
        /* Label Styles - Universal */
        .glass-label {
          color: #000000 !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          margin-bottom: 10px !important;
          display: block;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .glass-label {
            font-size: 15px !important;
            margin-bottom: 12px !important;
          }
        }
        
        /* Button Styles com melhorias mobile */
        .dark-mode .glass-button {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .dark-mode .glass-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(31, 38, 135, 0.4);
        }
        
        .light-mode .glass-button {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(203, 213, 225, 0.8);
          color: #1e293b;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .light-mode .glass-button:hover {
          background: rgba(255, 255, 255, 1);
          border: 1px solid rgba(148, 163, 184, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .glass-button-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
          border: none !important;
          color: white !important;
          font-weight: 800 !important;
          font-size: 17px !important;
          padding: 16px 32px !important;
          border-radius: 12px !important;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5) !important;
          transition: all 0.2s ease;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .glass-button-primary {
            font-size: 18px !important;
            padding: 18px 28px !important;
            min-height: 56px !important;
            width: 100% !important;
          }
        }
        
        .glass-button-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%) !important;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.6) !important;
        }

        @media (max-width: 768px) {
          .glass-button-primary:hover:not(:disabled) {
            transform: none;
          }
        }
        
        .glass-button-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .glass-button-secondary {
          background: #ffffff !important;
          border: 2px solid #cbd5e1 !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          font-size: 17px !important;
          padding: 16px 32px !important;
          border-radius: 12px !important;
          transition: all 0.2s ease;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .glass-button-secondary {
            font-size: 18px !important;
            padding: 18px 28px !important;
            min-height: 56px !important;
            width: 100% !important;
          }
        }
        
        .glass-button-secondary:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        
        .dark-mode .glass-sidebar {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .light-mode .glass-sidebar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-right: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .dark-mode .nav-item {
          color: white;
        }
        
        .light-mode .nav-item {
          color: #1e293b;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 16px;
          font-weight: 500;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-decoration: none;
          background: transparent;
        }
        
        .dark-mode .nav-item:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .dark-mode .nav-item.active {
          background: rgba(255, 255, 255, 0.25);
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
        }
        
        .light-mode .nav-item:hover {
          background: rgba(99, 102, 241, 0.08);
        }
        
        .light-mode .nav-item.active {
          background: rgba(99, 102, 241, 0.15);
          font-weight: 600;
          color: #4f46e5;
        }
        
        .glass-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
        }
        
        /* Bottom Navigation - MELHOR CONTRASTE */
        .bottom-nav-bar {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(40px) !important;
          -webkit-backdrop-filter: blur(40px) !important;
          border-top: 2px solid rgba(226, 232, 240, 0.8) !important;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12) !important;
        }

        .dark-mode .bottom-nav-bar {
          background: rgba(0, 0, 0, 0.85) !important;
          backdrop-filter: blur(40px) !important;
          -webkit-backdrop-filter: blur(40px) !important;
          border-top: 2px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5) !important;
        }

        /* Bottom Nav Items - ALTO CONTRASTE */
        .bottom-nav-item {
          transition: all 0.2s ease;
        }

        .bottom-nav-item .nav-icon {
          transition: all 0.2s ease;
        }

        .bottom-nav-item .nav-text {
          font-weight: 700 !important;
          font-size: 11px !important;
          transition: all 0.2s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* Light mode - texto sempre visível */
        .light-mode .bottom-nav-item .nav-icon {
          color: #475569 !important;
        }

        .light-mode .bottom-nav-item .nav-text {
          color: #475569 !important;
        }

        .light-mode .bottom-nav-item.active .nav-icon {
          color: #4f46e5 !important;
        }

        .light-mode .bottom-nav-item.active .nav-text {
          color: #4f46e5 !important;
        }

        .light-mode .bottom-nav-item .nav-badge {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 2px solid #e2e8f0 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }

        .light-mode .bottom-nav-item.active .nav-badge {
          background: rgba(229, 231, 235, 0.98) !important;
          border: 2px solid #6366f1 !important;
        }

        /* Dark mode */
        .dark-mode .bottom-nav-item .nav-icon {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .dark-mode .bottom-nav-item .nav-text {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .dark-mode .bottom-nav-item.active .nav-icon {
          color: #ffffff !important;
        }

        .dark-mode .bottom-nav-item.active .nav-text {
          color: #ffffff !important;
        }

        .dark-mode .bottom-nav-item .nav-badge {
          background: rgba(255, 255, 255, 0.15) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
        }

        .dark-mode .bottom-nav-item.active .nav-badge {
          background: rgba(255, 255, 255, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.35) !important;
        }
        
        /* Dark/Light Mode Toggle */
        .mode-toggle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .dark-mode .mode-toggle {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .dark-mode .mode-toggle:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .light-mode .mode-toggle {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(203, 213, 225, 0.8);
        }
        
        .light-mode .mode-toggle:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* Animations */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Typography */
        .dark-mode .text-title {
          font-size: 36px;
          font-weight: 800;
          color: white;
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
        }
        
        .light-mode .text-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        @media (max-width: 768px) {
          .text-title {
            font-size: 28px !important;
          }
        }
        
        .dark-mode .text-subtitle {
          font-size: 18px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }
        
        .light-mode .text-subtitle {
          font-size: 18px;
          font-weight: 500;
          color: #475569;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .text-subtitle {
            font-size: 16px !important;
          }
        }
        
        .text-heading {
          font-size: 32px !important;
          font-weight: 900 !important;
          color: #000000 !important;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        @media (max-width: 768px) {
          .text-heading {
            font-size: 26px !important;
          }
        }
        
        .text-body {
          font-size: 17px !important;
          font-weight: 500 !important;
          color: #1e293b !important;
          line-height: 1.7 !important;
        }

        @media (max-width: 768px) {
          .text-body {
            font-size: 16px !important;
          }
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .dark-mode ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .dark-mode ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 5px;
        }
        
        .dark-mode ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
        
        .light-mode ::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
        }
        
        .light-mode ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 5px;
        }
        
        .light-mode ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
        
        /* Info Box - ALTO CONTRASTE */
        .info-box {
          background: #dbeafe !important;
          border: 3px solid #3b82f6 !important;
          border-radius: 12px;
          padding: 20px !important;
          margin-bottom: 24px !important;
        }

        @media (max-width: 768px) {
          .info-box {
            padding: 18px !important;
            margin-bottom: 20px !important;
          }
        }
        
        .info-box-title {
          color: #1e3a8a !important;
          font-size: 17px !important;
          font-weight: 800 !important;
          margin-bottom: 8px !important;
        }

        @media (max-width: 768px) {
          .info-box-title {
            font-size: 16px !important;
          }
        }
        
        .info-box-text {
          color: #1e40af !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          line-height: 1.7 !important;
        }

        @media (max-width: 768px) {
          .info-box-text {
            font-size: 15px !important;
          }
        }
        
        /* Modal Title - ALTO CONTRASTE */
        .modal-title {
          color: #000000 !important;
          font-size: 28px !important;
          font-weight: 900 !important;
          margin-bottom: 8px !important;
          letter-spacing: -0.02em;
        }

        @media (max-width: 768px) {
          .modal-title {
            font-size: 24px !important;
          }
        }
        
        .modal-description {
          color: #475569 !important;
          font-size: 17px !important;
          font-weight: 600 !important;
        }

        @media (max-width: 768px) {
          .modal-description {
            font-size: 16px !important;
          }
        }
        
        /* Helper text */
        .helper-text {
          color: #64748b !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          margin-top: 8px !important;
        }

        @media (max-width: 768px) {
          .helper-text {
            font-size: 14px !important;
          }
        }

        /* Touch targets maiores para mobile */
        @media (max-width: 768px) {
          button, a, input[type="checkbox"], input[type="radio"] {
            min-height: 44px !important;
            min-width: 44px !important;
          }

          /* Spacing melhorado para mobile */
          .space-y-5 > * + * {
            margin-top: 24px !important;
          }

          /* Grid responsivo */
          .grid-cols-2 {
            grid-template-columns: 1fr !important;
          }

          .md\\:grid-cols-2 {
            grid-template-columns: 1fr !important;
          }

          /* Cards com melhor espaçamento em mobile */
          .glass-card {
            padding: 16px !important;
          }
        }

        /* Melhorias de acessibilidade */
        *:focus-visible {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }

        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Prevent zoom on input focus (iOS) */
        @media (max-width: 768px) {
          input[type="text"],
          input[type="email"],
          input[type="number"],
          input[type="tel"],
          input[type="date"],
          input[type="time"],
          textarea,
          select {
            font-size: 16px !important;
          }
        }
      `}</style>

      {isMobile ? (
        /* MOBILE LAYOUT */
        <div className="relative z-10 pb-20">
          {/* Mobile Header */}
          <div className="sticky top-0 z-50 glass-strong">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mar Quente</h1>
                    <p className={`text-xs ${darkMode ? 'text-white/80' : 'text-gray-600'}`}>Intranet 5.0</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleDarkMode}
                    className="mode-toggle"
                  >
                    {darkMode ? (
                      <Sun className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-700" />
                    )}
                  </button>

                  <button className="relative p-2.5 glass rounded-xl hover:glass-strong transition-all">
                    <Bell className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                    {notifications > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>

                  {user && (
                    <button onClick={() => setShowProfileDialog(true)} className="glass rounded-xl p-1">
                      <Avatar className="w-9 h-9 border-2 border-white/30 shadow-lg">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Content */}
          <main className="px-4 py-6 relative z-10">
            {children}
          </main>

          {/* Bottom Navigation - MELHORADO */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bottom-nav-bar">
            <div className="grid grid-cols-5 gap-1 px-2 py-2.5">
              {filteredNavigationItems.slice(0, 5).map((item) => {
                const isActive = location.pathname === item.url;
                const displayTitle = item.title === "Mensagens" ? "Msg" : item.title;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className="bottom-nav-item flex flex-col items-center gap-1 py-1.5"
                  >
                    <div className={`nav-badge p-2 rounded-xl ${isActive ? 'active' : ''}`}>
                      <item.icon className="nav-icon w-5 h-5" />
                    </div>
                    <span className="nav-text">
                      {displayTitle}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT */
        <div className="flex min-h-screen relative z-10">
          {/* Sidebar */}
          <aside className="w-80 glass-sidebar flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mar Quente</h1>
                  <p className={`text-sm ${darkMode ? 'text-white/80' : 'text-gray-600'}`}>Intranet 5.0</p>
                </div>
              </div>
            </div>

            {/* User Info - REMOVIDO GRID DE NÍVEL E MOEDAS */}
            {user && (
              <div className="p-6 border-b border-white/20">
                <button
                  onClick={() => setShowProfileDialog(true)}
                  className="w-full text-left hover:opacity-80 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-white/30 shadow-lg">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.full_name || user.email}</h3>
                      <p className={`text-sm truncate ${darkMode ? 'text-white/80' : 'text-gray-600'}`}>{user.position}</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {filteredNavigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Settings & Mode Toggle */}
            <div className="p-4 border-t border-white/20 space-y-3">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-5 py-4 glass rounded-2xl hover:glass-strong transition-all"
              >
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <>
                      <Sun className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                      <span className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-6 h-6 text-gray-700" />
                      <span className="font-semibold text-base text-gray-900">Modo Escuro</span>
                    </>
                  )}
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between px-5 py-4 glass rounded-2xl hover:glass-strong transition-all">
                    <div className="flex items-center gap-3">
                      <Settings className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                      <span className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Configurações</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-white/70' : 'text-gray-600'}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-64 bg-white border-2 border-gray-200 shadow-xl p-2 mb-2">
                  {user && user.role === 'admin' && (
                    <>
                      <Link to={createPageUrl("Admin")}>
                        <DropdownMenuItem className="cursor-pointer text-gray-900 font-semibold hover:bg-gray-100 rounded-lg py-3 text-base">
                          <Shield className="w-5 h-5 mr-3" />
                          Painel Admin
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-gray-300 my-2" />
                    </>
                  )}
                  {user && (user.department === 'RH' || user.role === 'admin') && (
                    <>
                      <Link to={createPageUrl("HRDashboard")}>
                        <DropdownMenuItem className="cursor-pointer text-gray-900 font-semibold hover:bg-gray-100 rounded-lg py-3 text-base">
                          <FileText className="w-5 h-5 mr-3" />
                          Dashboard RH
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-gray-300 my-2" />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="cursor-pointer text-gray-900 font-semibold hover:bg-gray-100 rounded-lg py-3 text-base">
                    <UserIcon className="w-5 h-5 mr-3" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-gray-900 font-semibold hover:bg-gray-100 rounded-lg py-3 text-base">
                    <Bell className="w-5 h-5 mr-3" />
                    Notificações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-300 my-2" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 font-bold hover:bg-red-50 rounded-lg py-3 text-base">
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Header */}
            <header className="glass-strong border-b border-white/20 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-title flex items-center gap-3">
                    <Sparkles className="w-8 h-8" />
                    {currentPageName === "Dashboard" && "Painel"}
                    {currentPageName === "Announcements" && "Mural"}
                    {currentPageName === "Messaging" && "Mensagens"}
                    {currentPageName === "HRRequests" && "RH"}
                    {currentPageName === "Contents" && "Cursos"}
                    {currentPageName === "Manuals" && "Manuais"}
                    {currentPageName === "Contacts" && "Contatos"}
                    {currentPageName === "MQNews" && "MQ News"}
                    {currentPageName === "CustomForms" && "Formulários"}
                    {currentPageName === "PerformanceReviews" && "Avaliações"}
                    {currentPageName === "Suggestions" && "Envie Sua Melhoria"}
                    {currentPageName === "AnonymousComplaint" && "Canal de Denúncia"}
                    {currentPageName === "Admin" && "Admin"}
                  </h1>
                  <p className="text-subtitle mt-2">
                    {currentPageName === "Dashboard" && "Suas metas e ferramentas em um só lugar"}
                    {currentPageName === "Announcements" && "Comunicados da Mar Quente"}
                    {currentPageName === "Messaging" && "Conecte-se e colabore em tempo real"}
                    {currentPageName === "HRRequests" && "Solicitações e serviços de RH"}
                    {currentPageName === "Contents" && "Cursos e materiais de treinamento"}
                    {currentPageName === "Manuals" && "Documentos, políticas e procedimentos"}
                    {currentPageName === "Contacts" && "Diretório de colaboradores"}
                    {currentPageName === "MQNews" && "Noticiário mensal da Mar Quente"}
                    {currentPageName === "CustomForms" && "Pesquisas, votações CIPA e enquetes"}
                    {currentPageName === "PerformanceReviews" && "Sistema de avaliação 360°"}
                    {currentPageName === "Suggestions" && "Compartilhe suas ideias de melhoria"}
                    {currentPageName === "AnonymousComplaint" && "Canal confidencial e anônimo"}
                    {currentPageName === "Admin" && "Gerenciamento e configurações"}
                  </p>
                </div>
                
                <button className="relative p-3 glass rounded-2xl hover:glass-strong transition-all">
                  <Bell className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white/30">
                      {notifications}
                    </Badge>
                  )}
                </button>
              </div>
            </header>

            {/* Page Content - AJUSTADO PARA MENSAGENS */}
            <div className={`flex-1 ${currentPageName === 'Messaging' ? 'overflow-hidden' : 'overflow-y-auto'} p-8`}>
              {children}
            </div>
          </main>
        </div>
      )}

      {/* Profile Dialog */}
      {user && (
        <UserProfile
          user={user}
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          onUpdate={loadUser}
        />
      )}
    </div>
  );
}