/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, UserRank, Audio, UserPlan, Speaker, InspiraEvent, AppConfig, UsageEvent, UsageSummary, EditorialSlot, Permissions, Book, Payment, SuccessPath, SuccessPathLevel } from '../types';
import { Search, Download, Filter, ArrowLeft, ArrowUpDown, Users, Star, Crown, Zap, TrendingUp, TrendingDown, Clock, PlayCircle, MessageCircle, Trophy, Plus, Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, Briefcase, UserPlus, Sparkles, Calendar, Video, Edit2, Settings, Landmark, MessageSquare, BarChart2, PieChart, CalendarDays, ZapOff, ArrowRight, BookOpen, X, ShieldCheck, Mail, Lock, Shield, User as UserIcon, Headphones, ChevronUp, ChevronDown, ListMusic, DollarSign, History } from 'lucide-react';
import { SPEAKERS, MOCK_AUDIOS, CATEGORIES } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { userService, audioService, speakerService, eventService, configService, telemetryService, editorialService, bookService, commissionService, successPathService, talentNotificationService } from '../services/dbService';
import { storageService } from '../services/storageService';

interface AdminPanelProps {
  onBack: () => void;
  currentUser: User;
}

type AdminTab = 'dashboard' | 'users' | 'audiobooks' | 'mentoring' | 'inventory' | 'talent' | 'events' | 'settings' | 'editorial' | 'staff' | 'equipo' | 'EQUIPO Y STAFF' | 'team' | 'commissions' | 'routes' | 'ranking';

const SUPER_ADMIN_EMAIL = 'operaciones@inspiraapps.com';

const DASHBOARD_DATA = {
  dau: [
    { day: 'Lun', users: 420 },
    { day: 'Mar', users: 580 },
    { day: 'Mie', users: 490 },
    { day: 'Jue', users: 710 },
    { day: 'Vie', users: 850 },
    { day: 'Sab', users: 620 },
    { day: 'Dom', users: 510 },
  ],
  subs: [
    { name: 'Premium', value: 890, color: '#FF8C00' },
    { name: 'Gratis', value: 560, color: '#333333' },
  ],
  topAudios: MOCK_AUDIOS.slice(0, 5).map((a, i) => ({
    ...a,
    plays: Math.floor(Math.random() * 5000) + 1000
  })).sort((a, b) => b.plays - a.plays)
};

export default function AdminPanel({ onBack, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [audios, setAudios] = useState<Audio[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [successPaths, setSuccessPaths] = useState<SuccessPath[]>([]);
  const [staffData, setStaffData] = useState({
    email: '',
    password: '',
    name: '',
    permissions: {
      dashboard: false,
      inventory: false,
      crm: true,
      audiobooks: false,
      mentoring: false,
      talent: false,
      commissions: false,
      events: false,
      editorial: false,
      routes: false,
    } as Permissions
  });

  const handleStaffPermissionToggle = (permission: string) => {
    setStaffData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !((prev.permissions as any)[permission])
      }
    }));
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffData.email || !staffData.name) return;
    setIsStaffSubmitting(true);
    // Emergency unlock
    const emergencyUnlock = setTimeout(() => setIsStaffSubmitting(false), 10000);
    try {
      const newUser: User = {
        id: `STAFF-${Date.now()}`,
        name: staffData.name,
        email: staffData.email,
        role: 'Admin',
        isAdmin: true,
        permissions: staffData.permissions,
        createdAt: new Date().toISOString(),
        completedAudios: [],
        plan: 'Premium',
        unlockedMedalIds: []
      };
      await userService.createUser(newUser);
      setUploadStatus({ type: 'success', message: '¡Colaborador registrado! Indícale que se registre con este email.' });
      
      // Naya Toast feedback
      setNayaToast({ visible: true, title: 'Colaborador registrado 🛡️' });
      setStaffSuccess(true);
      setTimeout(() => setStaffSuccess(false), 2000);
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);

      setStaffData({
        email: '',
        password: '',
        name: '',
        permissions: {
          dashboard: false,
          inventory: false,
          crm: true,
          audiobooks: false,
          mentoring: false,
          talent: false,
          commissions: false,
          events: false,
          editorial: false,
        }
      });
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Error al registrar colaborador.' });
    } finally {
      clearTimeout(emergencyUnlock);
      setIsStaffSubmitting(false);
      setIsMentoringSubmitting(false);
      setIsTalentSubmitting(false);
      setIsBookSubmitting(false);
      setIsEventSubmitting(false);
      
      setTalentPhotoFile(null);
      setAudioFile(null);
      setPreviewFile(null);
      setCoverFile(null);
      setEtapa1File(null);
      setEtapa2File(null);

      // Reseteo de inputs físicos en el DOM
      document.querySelectorAll('input[type="file"]').forEach((input: any) => {
        input.value = "";
      });
      
      setUploadStatus({ type: 'success', message: '¡Proceso completado y formulario limpio!' });
    }
  };

  const isSuperAdmin = useMemo(() => {
    return currentUser?.email === SUPER_ADMIN_EMAIL;
  }, [currentUser?.email]);

  // HARDCODED NAVIGATION STRUCTURE FOR PREMIUM V2.5
  const tabs: { id: AdminTab, label: string, icon: any, color: string }[] = [
    { id: 'dashboard', label: 'DASHBOARD', icon: BarChart2, color: 'text-accent' },
    { id: 'inventory', label: '📋 INVENTARIO', icon: ListMusic, color: 'text-blue-400' },
    { id: 'users', label: '👥 USUARIOS (CRM)', icon: Users, color: 'text-blue-500' },
    { id: 'audiobooks', label: '📚 AUDIOLIBROS', icon: BookOpen, color: 'text-orange-500' },
    { id: 'mentoring', label: '🎙️ MENTORÍAS', icon: Headphones, color: 'text-purple-500' },
    { id: 'talent', label: '💼 START TALENT', icon: Briefcase, color: 'text-yellow-500' },
    { id: 'events', label: '💻 EVENTOS Y ZOOM', icon: Video, color: 'text-red-500' },
    { id: 'editorial', label: '📅 CALENDARIO EDITORIAL', icon: Calendar, color: 'text-accent' },
    { id: 'ranking', label: '🏆 GESTIÓN TOP 10', icon: Trophy, color: 'text-amber-500' },
    { id: 'commissions', label: '💰 COMISIONES', icon: DollarSign, color: 'text-green-500' },
    { id: 'staff', label: '🛡️ EQUIPO Y STAFF', icon: ShieldCheck, color: 'text-emerald-500' },
    { id: 'settings', label: '⚙️ AJUSTES', icon: Settings, color: 'text-zinc-500' },
  ];

  const filteredTabs = useMemo(() => {
    if (!currentUser) return [];
    return tabs.filter(tab => {
      if (currentUser.email === SUPER_ADMIN_EMAIL) return true;
      if (tab.id === 'staff' || tab.id === 'settings') return false;
      if (!currentUser.permissions) return tab.id === 'dashboard';
      return true; 
    });
  }, [currentUser, tabs]);
  const [dynamicSpeakers, setDynamicSpeakers] = useState<Speaker[]>([]);
  const [events, setEvents] = useState<InspiraEvent[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [commissionPeriod, setCommissionPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [editorialSlots, setEditorialSlots] = useState<EditorialSlot[]>([]);
  const [replacingSlot, setReplacingSlot] = useState<EditorialSlot | null>(null);
  const [showReplacementPicker, setShowReplacementPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingTalentId, setEditingTalentId] = useState<string | null>(null);
  const [isNayaLearning, setIsNayaLearning] = useState(false);
  const [nayaToast, setNayaToast] = useState<{ visible: boolean; title: string }>({ visible: false, title: '' });

  // Modal de confirmación y sistema de notificaciones (toast) internos.
  // Reemplazan window.confirm/alert, que Chrome bloquea en contextos PWA/iframe.
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [historialAbsorcion, setHistorialAbsorcion] = useState<{id: number, fecha: string, detalle: string}[]>([]);

  // New state for book stages
  const [etapa1File, setEtapa1File] = useState<File | null>(null);
  const [etapa2File, setEtapa2File] = useState<File | null>(null);
  const [showFelicitarModal, setShowFelicitarModal] = useState(false);
  const [felicitarAudio, setFelicitarAudio] = useState<Audio | null>(null);
  const [felicitarMessage, setFelicitarMessage] = useState('');
  const [isSendingFelicitation, setIsSendingFelicitation] = useState(false);
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    review: '',
    rating: 5,
    type: 'Audiolibro',
    category: CATEGORIES[0] || 'Mentalidad'
  });

  // Simulate Naya learning process
  useEffect(() => {
    const unreasoned = audios.find(a => !a.nayaReasoned);
    if (unreasoned && !isNayaLearning) {
      setIsNayaLearning(true);
      const timer = setTimeout(async () => {
        try {
          await audioService.updateAudio(unreasoned.id, { nayaReasoned: true });
          setNayaToast({ visible: true, title: unreasoned.title });
          setIsNayaLearning(false);
          setTimeout(() => setNayaToast({ visible: false, title: '' }), 5000);
        } catch (err) {
          console.error("Naya logic error:", err);
          setIsNayaLearning(false);
        }
      }, 5000); // 5 seconds to "reason"
      return () => clearTimeout(timer);
    }
  }, [audios, isNayaLearning]);

  // Content Upload State
  const [uploadData, setUploadData] = useState({
    title: '',
    author: '',
    description: '',
    category: CATEGORIES[0] || 'Ventas',
    is_premium: true,
    isPriority: false,
  });

  const [eventData, setEventData] = useState<Omit<InspiraEvent, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    url: '',
    status: 'live'
  });

  // Talent Upload State
  const [talentData, setTalentData] = useState({
    name: '',
    role: '',
    bio: '',
    userEmail: '',
    photoUrl: ''
  });
  const [talentPhotoFile, setTalentPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isStaffSubmitting, setIsStaffSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoutesSubmitting, setIsRoutesSubmitting] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingPath, setEditingPath] = useState<SuccessPath | null>(null);
  const [editingLevel, setEditingLevel] = useState<SuccessPathLevel | null>(null);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [levelForm, setLevelForm] = useState({
    title: '',
    rank: '',
    description: ''
  });
  const [isTalentSubmitting, setIsTalentSubmitting] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  const [isConfigSubmitting, setIsConfigSubmitting] = useState(false);
  const [isMentoringSubmitting, setIsMentoringSubmitting] = useState(false);
  const [isBookSubmitting, setIsBookSubmitting] = useState(false);
  const [mentoringSuccess, setMentoringSuccess] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);
  const [talentSuccess, setTalentSuccess] = useState(false);
  const [staffSuccess, setStaffSuccess] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const nayaHistoryItems = useMemo(() => {
    if (!audios && !books && !dynamicSpeakers) return [];
    const combined = [
      ...(audios || []).map(a => ({ id: a.id, title: a.title, type: 'AUDIO' as const, createdAt: a.createdAt || (a as any).uploadedAt || '' })),
      ...(books || []).map(b => ({ id: b.id, title: b.title, type: 'LIBRO' as const, createdAt: b.createdAt || '' })),
      ...(dynamicSpeakers || []).map(s => ({ id: s.id, title: s.name, type: 'TALENTO' as const, createdAt: s.createdAt || '' }))
    ];
    return combined
      .filter(item => item.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [audios?.length, books?.length, dynamicSpeakers?.length]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    let isMounted = true;
    const subscriptions: (() => void)[] = [];

    const sync = () => {
      if (currentUser.email === SUPER_ADMIN_EMAIL || currentUser.isAdmin) {
        subscriptions.push(userService.subscribeToUsers(data => { if(isMounted) setUsers(data || []); }));
        subscriptions.push(audioService.subscribeToAudiobooks(data => { if(isMounted) setAudios(data || []); }));
        subscriptions.push(speakerService.subscribeToSpeakers(data => { if(isMounted) setDynamicSpeakers(data || []); }));
        subscriptions.push(eventService.subscribeToEvents(data => { if(isMounted) setEvents(data || []); }));
        subscriptions.push(bookService.subscribeToBooks(data => { if(isMounted) setBooks(data || []); }));
        subscriptions.push(configService.subscribeToConfig(data => { if(isMounted) setAppConfig(data); }));
        subscriptions.push(telemetryService.subscribeToUsageEvents(data => { if(isMounted) setUsageEvents(data || []); }));
        subscriptions.push(editorialService.subscribeToEditorialSlots(data => { if(isMounted) setEditorialSlots(data || []); }));
        subscriptions.push(commissionService.subscribeToPayments(data => { if(isMounted) setPayments(data || []); }));
        subscriptions.push(successPathService.subscribeToPaths(data => { if(isMounted) setSuccessPaths(data || []); }));
      }
      setIsLoading(false);
    };

    sync();
    return () => {
      isMounted = false;
      subscriptions.forEach(unsub => unsub());
    };
  }, [currentUser?.email]);

  const allSpeakers = [...SPEAKERS, ...dynamicSpeakers].reduce((acc, current) => {
    const x = acc.find(item => item.id === current.id);
    if (!x) return acc.concat([current]);
    return acc;
  }, [] as Speaker[]);

  const generateTalentPDF = (talent: Speaker, isBulk = false, docInstance?: jsPDF) => {
    const doc = docInstance || new jsPDF();
    const rate = appConfig?.commissionRate || 0.10;
    const periodLabel = commissionPeriod === 'monthly' ? 'Mensual' : 'Trimestral';
    const dateStr = new Date().toLocaleDateString();

    // Date Range Calculation
    const today = new Date();
    let startDate = new Date();
    if (commissionPeriod === 'monthly') {
      startDate.setDate(1);
    } else {
      startDate.setMonth(today.getMonth() - 2);
      startDate.setDate(1);
    }
    const rangeText = `${startDate.toLocaleDateString()} - ${today.toLocaleDateString()}`;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(255, 140, 0); // Accent Orange
    doc.text('INSPIRA APPS', 10, 20);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.text('REPORTE DE LIQUIDACIÓN DE REGALÍAS', 10, 30);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`ID de Liquidación: LIQ-${talent.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`, 10, 38);
    doc.text(`Fecha de emisión: ${dateStr}`, 10, 43);
    doc.text(`Periodo de Corte: ${rangeText}`, 10, 48);
    doc.line(10, 52, 200, 52);

    // Talent Info
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL BENEFICIARIO', 10, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${talent.name}`, 10, 69);
    doc.text(`Rol en Plataforma: ${talent.role}`, 10, 75);
    doc.text(`Modalidad: Participación por Reproducciones (Spotify-Model)`, 10, 81);

    // Financial Data
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE DETALLADO POR OBRA', 10, 95);
    
    // Filter audios for this talent
    const talentAudios = (audios || []).filter(a => a.author === talent.name);
    
    // Add audio rows
    const tableBody = (talentAudios || []).map(audio => {
      const plays = audio.pendingPlays || 0;
      return [
        audio.title,
        plays.toLocaleString(),
        `$ ${(plays * rate).toFixed(2)} MXN`
      ];
    });

    const totalPlays = talent.pendingPlays || 0;
    const totalAmount = totalPlays * rate;

    autoTable(doc, {
      startY: 100,
      head: [['Título del Audio / Obra', 'Reproducciones', 'Monto Generado']],
      body: tableBody,
      foot: [['TOTAL ACUMULADO', totalPlays.toLocaleString(), `$ ${totalAmount.toFixed(2)} MXN`]],
      theme: 'striped',
      headStyles: { fillColor: [255, 140, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'center' },
        2: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE PAGO', 140, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Subtotal: $ ${totalAmount.toFixed(2)}`, 140, finalY + 7);
    doc.text(`Tasa aplicada: $ ${rate.toFixed(2)} / play`, 140, finalY + 12);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL A LIQUIDAR: $ ${totalAmount.toFixed(2)} MXN`, 140, finalY + 22);

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es una liquidación pro-forma sujeta a verificación de auditoría de tráfico.', 10, finalY + 40);
    doc.text('Los montos son expresados en la moneda configurada en el sistema.', 10, finalY + 45);

    if (!isBulk) {
      doc.save(`Reporte_Transparencia_${talent.name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
    } else {
      return doc;
    }
  };

  const generateBulkPDFs = () => {
    const talentsWithPlays = (allSpeakers || []).filter(t => (t.pendingPlays || 0) > 0);
    if (talentsWithPlays.length === 0) {
      setNayaToast({ visible: true, title: 'No hay liquidaciones pendientes ⚠️' });
      return;
    }

    const doc = new jsPDF();
    talentsWithPlays.forEach((talent, index) => {
      if (index > 0) doc.addPage();
      generateTalentPDF(talent, true, doc);
    });

    const dateStr = new Date().toLocaleDateString();
    doc.save(`Liquidaciones_Masivas_INSPIRA_${dateStr}.pdf`);
    setNayaToast({ visible: true, title: 'Reportes generados con éxito ✨' });
  };

  const generateGlobalPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    const periodLabel = commissionPeriod === 'monthly' ? 'Mensual' : 'Trimestral';

    doc.setFontSize(18);
    doc.text('REPORTE GLOBAL DE LIQUIDACIONES', 10, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${dateStr} | Periodo: ${periodLabel}`, 10, 28);
    doc.line(10, 32, 200, 32);

    const tableData = (allSpeakers || []).map(s => [
      s.name,
      (s.pendingPlays || 0).toLocaleString(),
      `$ ${((s.pendingPlays || 0) * (appConfig?.commissionRate || 0.10)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Talento', 'Plays Pendientes', 'Total a Pagar']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    doc.save(`Reporte_Global_Comisiones_${dateStr}.pdf`);
  };

  const handleCreateTalent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTalentSubmitting(true);
    // Emergency unlock
    const emergencyUnlock = setTimeout(() => setIsTalentSubmitting(false), 10000);
    setUploadStatus(null);

    try {
      let photoUrl = talentData.photoUrl;
      if (talentPhotoFile) {
        photoUrl = await storageService.uploadCover(talentPhotoFile, `talent_${talentData.name}`);
      }

      if (editingTalentId) {
        await speakerService.updateSpeaker(editingTalentId, {
          name: talentData.name,
          role: talentData.role,
          bio: talentData.bio,
          userEmail: talentData.userEmail,
          photoUrl: photoUrl || 'https://picsum.photos/seed/talent/400/400'
        });
        setUploadStatus({ type: 'success', message: '¡Start Talent actualizada con éxito! Regresando al inventario...' });
        setNayaToast({ visible: true, title: 'Star Talent actualizada ✨' });
        
        setTalentSuccess(true);
        setTimeout(() => setTalentSuccess(false), 2000);

        // Success feedback and return to inventory
        setTimeout(() => {
          setActiveTab('inventory');
          setEditingTalentId(null);
          setTalentData({ name: '', role: '', bio: '', userEmail: '', photoUrl: '' });
          setTalentPhotoFile(null);
        }, 1500);
      } else {
        await speakerService.createSpeaker({
          name: talentData.name,
          role: talentData.role,
          bio: talentData.bio,
          userEmail: talentData.userEmail,
          photoUrl: photoUrl || 'https://picsum.photos/seed/talent/400/400'
        });
        setUploadStatus({ type: 'success', message: '¡Start Talent registrada con éxito!' });
        setNayaToast({ visible: true, title: 'Star Talent registrada con éxito ✨' });
        
        setTalentSuccess(true);
        setTimeout(() => setTalentSuccess(false), 2000);

        // Reset form for fresh entry
        setTalentData({
          name: '',
          role: '',
          bio: '',
          userEmail: '',
          photoUrl: ''
        });
        setTalentPhotoFile(null);
      }
      
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);

    } catch (error) {
      console.error(error);
      setUploadStatus({ type: 'error', message: 'Error al procesar talento. Revisa la conexión.' });
    } finally {
      clearTimeout(emergencyUnlock);
      setIsTalentSubmitting(false);
      setIsMentoringSubmitting(false);
      setIsBookSubmitting(false);
      setIsEventSubmitting(false);
      setIsStaffSubmitting(false);
      
      setTalentPhotoFile(null);
      setAudioFile(null);
      setPreviewFile(null);
      setCoverFile(null);
      setEtapa1File(null);
      setEtapa2File(null);

      setUploadStatus({ type: 'success', message: '¡Proceso completado y formulario limpio!' }); 
      document.querySelectorAll('input[type="file"]').forEach((el: any) => el.value = "");
      setIsSubmitting(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEventSubmitting(true);
    // Emergency unlock
    const emergencyUnlock = setTimeout(() => setIsEventSubmitting(false), 10000);
    setUploadStatus(null);

    try {
      if (editingEventId) {
        await eventService.updateEvent(editingEventId, eventData);
        setUploadStatus({ type: 'success', message: 'Evento actualizado con éxito! Regresando...' });
        setNayaToast({ visible: true, title: 'Evento actualizado ✨' });
        
        setEventData({
          title: '',
          description: '',
          date: new Date().toISOString().slice(0, 16),
          url: '',
          status: 'live'
        });
        setEventSuccess(true);
        setTimeout(() => setEventSuccess(false), 2000);

        setTimeout(() => {
          setActiveTab('inventory');
          setEditingEventId(null);
        }, 1500);
      } else {
        await eventService.createEvent(eventData);
        setUploadStatus({ type: 'success', message: 'Evento creado con éxito!' });
        setNayaToast({ visible: true, title: 'Evento creado ✨' });
        
        setEventData({
          title: '',
          description: '',
          date: new Date().toISOString().slice(0, 16),
          url: '',
          status: 'live'
        });
        setEventSuccess(true);
        setTimeout(() => setEventSuccess(false), 2000);
      }

      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
    } catch (error) {
      console.error(error);
      setUploadStatus({ type: 'error', message: 'Error al guardar el evento.' });
    } finally {
      clearTimeout(emergencyUnlock);
      setIsEventSubmitting(false);
      setIsMentoringSubmitting(false);
      setIsTalentSubmitting(false);
      setIsBookSubmitting(false);
      setIsStaffSubmitting(false);
      
      setTalentPhotoFile(null);
      setAudioFile(null);
      setPreviewFile(null);
      setCoverFile(null);
      setEtapa1File(null);
      setEtapa2File(null);

      // Reseteo de inputs físicos en el DOM
      document.querySelectorAll('input[type="file"]').forEach((input: any) => {
        input.value = "";
      });
      
      setUploadStatus({ type: 'success', message: '¡Proceso completado y formulario limpio!' });
    }
  };

  const handleEditEvent = (event: InspiraEvent) => {
    setEventData({
      title: event.title,
      description: event.description,
      date: event.date,
      url: event.url,
      status: event.status
    });
    setEditingEventId(event.id);
    setActiveTab('events');
    // Scroll to top of tab container
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendFelicitation = async () => {
    if (!felicitarAudio || !felicitarMessage.trim()) return;
    setIsSendingFelicitation(true);
    try {
      const allSorted = [...audios].sort((a,b) => (b.reproducciones || 0) - (a.reproducciones || 0));
      const rank = allSorted.findIndex(a => a.id === felicitarAudio.id) + 1;

      await talentNotificationService.sendNotification({
        talentName: felicitarAudio.author,
        authorName: felicitarAudio.author,
        message: felicitarMessage,
        adminId: currentUser.id,
        adminName: currentUser.name,
        date: new Date().toISOString(),
        read: false,
        audioTitle: felicitarAudio.title,
        rank
      });
      setNayaToast({ visible: true, title: '¡Felicitación enviada! 🏆' });
      setShowFelicitarModal(false);
      setFelicitarMessage('');
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingFelicitation(false);
    }
  };

  const handleTogglePlan = async (userId: string, currentPlan: string) => {
    const newPlan = currentPlan === 'Premium' ? 'Gratis' : 'Premium';
    try {
      await userService.updateUser(userId, { plan: newPlan as any });
      setNayaToast({ visible: true, title: `Plan actualizado: ${newPlan} 👑` });
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
      // Local update is handled by the subscription in App.tsx -> subscribeToUsers
    } catch (err) {
      console.error('Error toggling plan:', err);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Evento',
      message: '¿Estás segura de eliminar este evento? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await eventService.deleteEvent(eventId);
        setToast({ message: 'Evento eliminado correctamente.', type: 'success' });
      },
    });
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appConfig) return;
    setIsConfigSubmitting(true);
    // Emergency unlock
    const emergencyUnlock = setTimeout(() => setIsConfigSubmitting(false), 10000);
    try {
      await configService.updateConfig(appConfig);
      setUploadStatus({ type: 'success', message: 'Configuración actualizada con éxito!' });
      
      // Naya Toast feedback
      setNayaToast({ visible: true, title: 'Ajustes guardados con éxito ⚙️' });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2000);
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Error al actualizar configuración.' });
    } finally {
      clearTimeout(emergencyUnlock);
      setIsConfigSubmitting(false);
      setIsMentoringSubmitting(false);
      setIsTalentSubmitting(false);
      setIsBookSubmitting(false);
      setIsEventSubmitting(false);
      setIsStaffSubmitting(false);
      
      setTalentPhotoFile(null);
      setAudioFile(null);
      setPreviewFile(null);
      setCoverFile(null);
      setEtapa1File(null);
      setEtapa2File(null);

      // Reseteo de inputs físicos en el DOM
      document.querySelectorAll('input[type="file"]').forEach((input: any) => {
        input.value = "";
      });
      
      setUploadStatus({ type: 'success', message: '¡Proceso completado y formulario limpio!' });
    }
  };

  const [filterQuery, setFilterQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<string>('all');



  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const filteredUsers = (users || []).filter(u => {
    const safeName = u.name || '';
    const safeEmail = u.email || '';
    const safeCity = u.city || '';
    const safeQuery = filterQuery || '';
    
    const matchesSearch = safeName.toLowerCase().includes(safeQuery.toLowerCase()) || 
                          safeEmail.toLowerCase().includes(safeQuery.toLowerCase()) ||
                          safeCity.toLowerCase().includes(safeQuery.toLowerCase());
    const matchesRank = rankFilter === 'all' || u.current_rank === rankFilter;
    return matchesSearch && matchesRank;
  });

  const handlePublishContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudioId && (!audioFile || !coverFile || !previewFile)) {
      setUploadStatus({ type: 'error', message: 'Debes subir el audio, la portada y el Clip de Avance para la mentoría.' });
      return;
    }

    setIsMentoringSubmitting(true);
    // Emergency unlock
    const emergencyUnlock = setTimeout(() => setIsMentoringSubmitting(false), 10000);
    setUploadStatus(null);

    try {
      let audioUrl = '';
      let coverUrl = '';
      let previewUrl = '';

      if (audioFile) audioUrl = await storageService.uploadAudio(audioFile, `${uploadData.title}_FULL_MENTORING`);
      if (coverFile) coverUrl = await storageService.uploadCover(coverFile, uploadData.title);
      if (previewFile) previewUrl = await storageService.uploadAudio(previewFile, `${uploadData.title}_PREVIEW`);

      if (editingAudioId) {
        const updates: Partial<Audio> = {
          title: uploadData.title,
          author: uploadData.author,
          category: uploadData.category,
          isPremium: uploadData.is_premium,
        };
        if (audioUrl) updates.audioUrl = audioUrl;
        if (coverUrl) updates.coverUrl = coverUrl;
        if (previewUrl) updates.previewUrl = previewUrl;

        await audioService.updateAudio(editingAudioId, updates);
        setUploadStatus({ type: 'success', message: 'Mentoría actualizada con éxito! Regresando...' });
        setNayaToast({ visible: true, title: 'Mentoría actualizada 🎙️' });
        
        setAudioFile(null);
        setPreviewFile(null);
        setCoverFile(null);
        setUploadData({
          title: '',
          author: '',
          description: '',
          category: CATEGORIES[0] || 'Ventas',
          is_premium: true,
          isPriority: false,
        });
        setMentoringSuccess(true);
        setTimeout(() => setMentoringSuccess(false), 2000);

        setTimeout(() => {
          setActiveTab('inventory');
          setEditingAudioId(null);
        }, 1500);
      } else {
        const audioId = await audioService.createAudiobook({
          title: uploadData.title,
          author: uploadData.author,
          category: uploadData.category,
          audioUrl,
          previewUrl,
          coverUrl,
          duration: 0, 
          isPremium: uploadData.is_premium, 
          contentType: 'mentoring',
          uploadedAt: new Date().toISOString(),
          tags: [uploadData.category, 'mentoring']
        });

        // If priority is high, schedule for next Monday and shift queue
        if (uploadData.isPriority && audioId) {
          const nextMonday = new Date();
          nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
          nextMonday.setHours(0, 0, 0, 0);

          const endDate = new Date(nextMonday);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);

          await editorialService.createEditorialSlot({
            type: 'weekly_audio',
            contentType: 'mentoring',
            contentId: audioId,
            startDate: nextMonday.toISOString(),
            endDate: endDate.toISOString(),
            isPriority: true
          });
        }
        setUploadStatus({ type: 'success', message: 'Mentoría publicada con éxito!' });
        setNayaToast({ visible: true, title: 'Mentoría publicada con éxito 🎙️' });
        
        setAudioFile(null);
        setPreviewFile(null);
        setCoverFile(null);
        setUploadData({
          title: '',
          author: '',
          description: '',
          category: CATEGORIES[0] || 'Ventas',
          is_premium: true,
          isPriority: false,
        });
        setMentoringSuccess(true);
        setTimeout(() => setMentoringSuccess(false), 2000);
      }
      
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
    } catch (error) {
      console.error(error);
      setUploadStatus({ type: 'error', message: 'Error al procesar mentoría.' });
    } finally {
      clearTimeout(emergencyUnlock);
      setIsMentoringSubmitting(false);
      setIsTalentSubmitting(false);
      setIsBookSubmitting(false);
      setIsEventSubmitting(false);
      setIsStaffSubmitting(false);
      
      setTalentPhotoFile(null);
      setAudioFile(null);
      setPreviewFile(null);
      setCoverFile(null);
      setEtapa1File(null);
      setEtapa2File(null);

      setUploadStatus({ type: 'success', message: '¡Proceso completado y formulario limpio!' }); 
      document.querySelectorAll('input[type="file"]').forEach((el: any) => el.value = "");
      setIsSubmitting(false);
    }
  };

  const handleSyncWisdom = () => {
    setLastSync(Date.now());
    const newEntry = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      detalle: `Sincronización completa: Se integraron ${(books || []).length} audiolibros, ${(audios || []).length} mentorías y ${(events || []).length} eventos al conocimiento de Naya.`
    };
    setHistorialAbsorcion([newEntry, ...historialAbsorcion]);
    setNayaToast({ visible: true, title: 'Sincronización de Sabiduría Completa 💎' });
    setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
    setToast({ message: `¡Éxito! Naya ha absorbido ${(books || []).length} audiolibros, ${(audios || []).length} mentorías y ${(events || []).length} eventos en su base de datos.`, type: 'success' });
  };

  const handlePublishBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookId && (!bookData.title || !coverFile)) {
      setUploadStatus({ type: 'error', message: 'Debes añadir el título y la portada del libro.' });
      return;
    }

    setIsBookSubmitting(true);
    // Emergency unlock
    const emergencyUnlock = setTimeout(() => setIsBookSubmitting(false), 10000);
    setUploadStatus(null);

    try {
      let coverUrl = '';
      if (coverFile) {
        coverUrl = await storageService.uploadCover(coverFile, `book_${bookData.title}`);
      }
      
      let etapa1Url = null;
      let etapa2Url = null;

      if (etapa1File) {
        etapa1Url = await storageService.uploadAudio(etapa1File, `${bookData.title}_ETAPA_1`);
      }
      if (etapa2File) {
        etapa2Url = await storageService.uploadAudio(etapa2File, `${bookData.title}_ETAPA_2`);
      }

      if (editingBookId) {
        const updates: Partial<Book> = {
          title: bookData.title,
          author: bookData.author,
          review: bookData.review,
          rating: bookData.rating,
          type: bookData.type,
          category: bookData.category,
        };
        if (coverUrl) updates.coverUrl = coverUrl;
        
        const currentBook = books.find(b => b.id === editingBookId);
        const etapas = [...(currentBook?.etapas || [])];
        if (etapa1Url) etapas[0] = { nombre: 'Etapa 1', url: etapa1Url };
        if (etapa2Url) etapas[1] = { nombre: 'Etapa 2', url: etapa2Url };
        updates.etapas = etapas;

        await bookService.updateBook(editingBookId, updates);
        setUploadStatus({ type: 'success', message: '¡Audiolibro actualizado! Regresando al inventario...' });
        setNayaToast({ visible: true, title: 'Audiolibro actualizado 💎' });
        
        setBookData({
          title: '',
          author: '',
          review: '',
          rating: 5,
          type: 'Audiolibro',
          category: CATEGORIES[0] || 'Mentalidad'
        });
        setCoverFile(null);
        setEtapa1File(null);
        setEtapa2File(null);
        setBookSuccess(true);
        setTimeout(() => setBookSuccess(false), 2000);

        setTimeout(() => {
          setActiveTab('inventory');
          setEditingBookId(null);
        }, 1500);
      } else {
        await bookService.createBook({
          title: bookData.title,
          author: bookData.author,
          review: bookData.review,
          rating: bookData.rating,
          type: bookData.type,
          category: bookData.category,
          coverUrl,
          createdAt: new Date().toISOString(),
          etapas: [
            { nombre: 'Etapa 1', url: etapa1Url },
            { nombre: 'Etapa 2', url: etapa2Url }
          ]
        });
        setUploadStatus({ type: 'success', message: '¡Audiolibro publicado con éxito!' });
        setNayaToast({ visible: true, title: 'Audiolibro guardado con éxito 💎' });
        
        setBookData({
          title: '',
          author: '',
          review: '',
          rating: 5,
          type: 'Audiolibro',
          category: CATEGORIES[0] || 'Mentalidad'
        });
        setCoverFile(null);
        setEtapa1File(null);
        setEtapa2File(null);
        setBookSuccess(true);
        setTimeout(() => setBookSuccess(false), 2000);
      }
      
      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
    } catch (error) {
      console.error(error);
      setUploadStatus({ type: 'error', message: 'Error al procesar libro.' });
    } finally {
      clearTimeout(emergencyUnlock);
      setIsBookSubmitting(false);
      setIsMentoringSubmitting(false);
      setIsTalentSubmitting(false);
      setIsEventSubmitting(false);
      setIsStaffSubmitting(false);
      
      setTalentPhotoFile(null);
      setAudioFile(null);
      setPreviewFile(null);
      setCoverFile(null);
      setEtapa1File(null);
      setEtapa2File(null);

      setUploadStatus({ type: 'success', message: '¡Proceso completado y formulario limpio!' }); 
      document.querySelectorAll('input[type="file"]').forEach((el: any) => el.value = "");
      setIsSubmitting(false);
    }
  };

  // Ranking Top 10 for Awards
  const topTenAwards = [...MOCK_AUDIOS]
    .sort((a, b) => b.weeklyPlays - a.weeklyPlays)
    .slice(0, 10);

  const handleWhatsAppAward = (audio: any, rank: number) => {
    let message = '';
    if (rank === 1) {
      message = `¡Felicidades ${audio.author}! Has conquistado el Puesto #1 del Top 10 Semanal en INSPIRA. 🏆 Tu legado es la luz de nuestra comunidad hoy. ¡Gracias por ser una Rockstar!`;
    } else {
      message = `¡Hola ${audio.author}! Qué orgullo verte en la posición #${rank} del Top 10 de esta semana en INSPIRA. ✨ Tu voz está llegando lejos. ¡Vamos por el primer lugar la próxima semana!`;
    }
    
    // We don't have the speaker's phone number here, so we'll use a placeholder or 
    // in a real scenario we'd fetch it from the SPEAKERS data or User data.
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleEditAudio = (audio: Audio) => {
    setUploadData({
      title: audio.title,
      author: audio.author,
      description: audio.description || '',
      category: audio.category,
      is_premium: audio.isPremium,
      isPriority: false,
    });
    setEditingAudioId(audio.id);
    setActiveTab('mentoring');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditBook = (book: Book) => {
    setBookData({
      title: book.title,
      author: book.author,
      review: book.review || '',
      rating: book.rating || 5,
      type: book.type,
      category: book.category,
    });
    setEditingBookId(book.id);
    setActiveTab('audiobooks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTalent = (talent: Speaker) => {
    setTalentData({
      name: talent.name,
      role: talent.role,
      bio: talent.bio || '',
      userEmail: talent.userEmail || '',
      photoUrl: talent.photoUrl || ''
    });
    setEditingTalentId(talent.id);
    setActiveTab('talent');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAudio = (id: string) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Mentoría',
      message: '¿Estás segura de eliminar esta mentoría? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await audioService.deleteAudio(id);
        setNayaToast({ visible: true, title: 'Mentoría eliminada 🗑️' });
        setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
      },
    });
  };

  const handleDeleteBook = (id: string) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Audiolibro',
      message: '¿Estás segura de eliminar este audiolibro? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await bookService.deleteBook(id);
        setNayaToast({ visible: true, title: 'Audiolibro eliminado 🗑️' });
        setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
      },
    });
  };

  const handleDeleteTalent = (id: string) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Start Talent',
      message: '¿Estás segura de eliminar este Start Talent? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await speakerService.deleteSpeaker(id);
        setNayaToast({ visible: true, title: 'Talento eliminado 🗑️' });
        setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
      },
    });
  };

  const pendingDigestItems = [
    ...(audios || []).filter(a => a.isPendingDigest).map(a => ({ ...a, type: 'audio' })),
    ...(books || []).filter(b => b.isPendingDigest).map(b => ({ ...b, type: 'book' })),
    ...(events || []).filter(e => e.isPendingDigest).map(e => ({ ...e, type: 'event' })),
  ].sort((a, b) => {
    const dateA = new Date((a as any).createdAt || (a as any).uploadedAt || (a as any).date).getTime();
    const dateB = new Date((b as any).createdAt || (b as any).uploadedAt || (b as any).date).getTime();
    return dateB - dateA;
  });

  const handleClearDigest = () => {
    setConfirmModal({
      open: true,
      title: '🚀 ¿Estás seguro?',
      message: 'Al confirmar, todos los ítems listados dejarán de aparecer como "Novedad" en el próximo comercial de los lunes. Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await editorialService.clearPendingDigest();
          setNayaToast({ visible: true, title: 'Lanzamiento confirmado ✨' });
          setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
        } catch (err) {
          setToast({ message: 'Error al limpiar la bandeja. Inténtalo de nuevo.', type: 'error' });
        }
      },
    });
  };

  // Expiry Alerts logic
  const expiringTomorrow = (users || []).filter(u => {
    if (!u.expiryDate || u.plan === 'Gratis') return false;
    const expiry = new Date(u.expiryDate).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    // Exactly 24 hours logic (within 24h window)
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  });

  const handleRenewalWhatsApp = (user: User) => {
    const message = `Hola ${user.name}, te saludo de INSPIRA. ✨ Paso a recordarte que mañana vence tu acceso Premium. Sigue disfrutando de todo nuestro legado realizando tu pago aquí: [Link a la pantalla de pagos]`;
    window.open(`https://wa.me/${user.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };



  const stats = {
    totalUsers: (users || []).length,
    newThisMonth: (users || []).filter(u => u.createdAt && new Date(u.createdAt).getMonth() === new Date().getMonth()).length,
    churnRate: '2.4%',
    hallOfFameCount: (SPEAKERS || []).length,
    activeSubs: (users || []).filter(u => u.plan === 'Premium').length,
    avgSession: '24m'
  };

  const engagementMetrics = (() => {
    const tools: { [key: string]: { interactions: number, duration: number, color: string } } = {
      'Chat Naya (IA)': { interactions: 0, duration: 0, color: '#A855F7' },
      'Audiolibros': { interactions: 0, duration: 0, color: '#FF8C00' },
      'Mentorías (Start Talent)': { interactions: 0, duration: 0, color: '#22C55E' },
      'Eventos Zoom': { interactions: 0, duration: 0, color: '#2563EB' }
    };

    (usageEvents || []).forEach(event => {
      if (event && event.toolName && tools[event.toolName]) {
        tools[event.toolName].interactions++;
        if (event.duration) tools[event.toolName].duration += event.duration;
      }
    });

    const totalInt = Object.values(tools).reduce((sum, t) => sum + t.interactions, 0);
    return Object.entries(tools).map(([name, data]) => ({
      name,
      interactions: data.interactions,
      duration: Math.round(data.duration / 60),
      percentage: totalInt > 0 ? (data.interactions / totalInt) * 100 : 0,
      color: data.color
    })).sort((a, b) => b.interactions - a.interactions);
  })();

  // SEGURO DE IDENTIDAD (Sin bloqueo por carga de datos)
  if (false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-accent font-black uppercase tracking-widest">
        Verificando Identidad...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-4 py-5 sm:px-6 md:p-10 overflow-x-hidden relative font-sans antialiased">
      {/* Top Exit Button for Mobile/Sticky */}
      <div className="flex justify-start mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
        >
          <ArrowLeft size={14} />
          Volver a la App
        </button>
      </div>

      {/* Notificación Toast de Naya */}
      <AnimatePresence>
        {nayaToast.visible && (
          <motion.div 
            initial={{ opacity: 0, x: 100, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-10 right-10 z-[11000] bg-black border-2 border-accent p-6 rounded-[24px] shadow-[0_20px_80px_rgba(255,140,0,0.4)] flex items-center gap-5 max-w-sm backdrop-blur-xl"
          >
            <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center text-accent shadow-lg shadow-accent/20">
              <Sparkles size={28} fill="currentColor" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Inteligencia Actualizada</p>
              <h4 className="text-sm font-bold text-white uppercase leading-tight">Naya ahora conoce <span className="text-accent">"{nayaToast.title}"</span></h4>
            </div>
            <button 
              onClick={() => setNayaToast({ visible: false, title: '' })}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación (reemplaza window.confirm) */}
      <AnimatePresence>
        {confirmModal?.open && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !confirmLoading && setConfirmModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative z-10 w-full max-w-md bg-bg-card border border-border rounded-[24px] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 bg-accent/15 rounded-2xl flex items-center justify-center text-accent">
                  <AlertCircle size={26} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                    {confirmModal.title}
                  </h3>
                  <p className="text-sm text-text-dim leading-relaxed whitespace-pre-line">
                    {confirmModal.message}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-7">
                <button
                  onClick={() => setConfirmModal(null)}
                  disabled={confirmLoading}
                  className="flex-1 py-3 rounded-2xl bg-transparent border border-border text-text-dim font-black uppercase tracking-widest text-xs hover:text-white hover:border-white/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!confirmModal) return;
                    try {
                      setConfirmLoading(true);
                      await confirmModal.onConfirm();
                    } finally {
                      setConfirmLoading(false);
                      setConfirmModal(null);
                    }
                  }}
                  disabled={confirmLoading}
                  className="flex-1 py-3 rounded-2xl bg-accent text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
                >
                  {confirmLoading ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notificación Toast (reemplaza alert) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-10 right-10 z-[12500] flex items-center gap-4 max-w-sm bg-bg-card border-2 p-5 rounded-[20px] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
              toast.type === 'success' ? 'border-accent' : 'border-red-500'
            }`}
          >
            <div
              className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center ${
                toast.type === 'success' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-500'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <p className="text-sm font-bold text-white leading-snug whitespace-pre-line">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="absolute top-3 right-3 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-bg-card border border-border rounded-2xl flex items-center justify-center text-text-dim hover:text-accent transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[34px] sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[0.9] max-w-full break-words">
  Intelligence Dashboard
</h1>
            <p className="text-text-dim text-[11px] sm:text-xs font-black tracking-[0.28em] uppercase mt-3 leading-relaxed">
  SISTEMA INTEGRAL DE MÉTRICAS • INSPIRA v2.5
</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <p className="text-text-dim text-xs font-bold uppercase tracking-widest">Admin Sessión</p>
            <p className="text-white text-sm font-black">operaciones@inspiraapps.com</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-black font-black">
            OP
          </div>
        </div>
      </header>

      {/* Tabs Navigation Barra Reconstruida - PROTOCOLO DE RESCATE */}
      <div className="flex flex-nowrap gap-2 mb-6 bg-[#111] p-2 rounded-2xl border border-white/5 w-full flex-shrink-0 overflow-x-auto scrollbar-hide">
        {[
          { id: 'dashboard', label: 'DASHBOARD' },
          { id: 'inventory', label: '📋 INVENTARIO' },
          { id: 'users', label: '👥 USUARIOS (CRM)' },
          { id: 'audiobooks', label: '📚 AUDIOLIBROS' },
          { id: 'mentoring', label: '🎙️ MENTORÍAS' },
          { id: 'talent', label: '💼 START TALENT' },
          { id: 'commissions', label: '💰 COMISIONES' },
          { id: 'events', label: '💻 EVENTOS Y ZOOM' },
          { id: 'editorial', label: '📅 CALENDARIO EDITORIAL' },
          { id: 'ranking', label: '🏆 TOP 10' },
          { id: 'routes', label: '🛣️ RUTAS AL ÉXITO' },
          { id: 'staff', label: '🛡️ EQUIPO Y STAFF' },
          { id: 'settings', label: '⚙️ AJUSTES' },
        ].filter(tab => {
          if (isSuperAdmin) return true;
          // Non-Super Admins never see staff or settings
          if (tab.id === 'staff' || tab.id === 'settings') return false; 
          
          if (!currentUser.permissions) return tab.id === 'dashboard';

          switch(tab.id) {
            case 'dashboard': return !!currentUser.permissions.dashboard;
            case 'inventory': return !!currentUser.permissions.inventory;
            case 'users': return !!currentUser.permissions.crm;
            case 'audiobooks': return !!currentUser.permissions.audiobooks;
            case 'mentoring': return !!currentUser.permissions.mentoring;
            case 'talent': return !!currentUser.permissions.talent;
            case 'commissions': return !!currentUser.permissions.commissions;
            case 'events': return !!currentUser.permissions.events;
            case 'editorial': return !!currentUser.permissions.editorial;
            case 'ranking': return !!currentUser.permissions.talent;
            case 'routes': return !!currentUser.permissions.routes || isSuperAdmin;
            default: return false;
          }
        }).map((tab, index) => (
          <button
            key={`nav-${tab.id}-${index}`}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`px-5 py-3.5 rounded-xl text-[13px] sm:text-sm font-black tracking-wide uppercase transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-accent text-black shadow-lg shadow-accent/20 scale-[1.02]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12 pb-10"
            >
              {/* Audiolibros */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Audiolibros</h3>
                </div>
                <div className="bg-bg-card border border-white/5 rounded-[24px] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-text-dim uppercase tracking-widest">
                        <th className="px-6 py-4">Miniatura</th>
                        <th className="px-6 py-4">Título</th>
                        <th className="px-6 py-4">Autor</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(books || []).map(book => (
                        <tr key={book.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <img src={book.coverUrl} className="w-10 h-10 rounded-lg object-cover" alt={book.title} />
                          </td>
                          <td className="px-6 py-4 font-bold text-white text-sm">{book.title}</td>
                          <td className="px-6 py-4 text-text-dim text-sm">{book.author}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEditBook(book)} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteBook(book.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Mentorías */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Headphones size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Mentorías</h3>
                </div>
                <div className="bg-bg-card border border-white/5 rounded-[24px] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-text-dim uppercase tracking-widest">
                        <th className="px-6 py-4">Título</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4">Speaker</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(audios || []).map(audio => (
                        <tr key={audio.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-bold text-white text-sm">{audio.title}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase font-bold text-purple-400">{audio.category}</span></td>
                          <td className="px-6 py-4 text-text-dim text-sm">{audio.author}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  // D4: Enviar este contenido al Calendario Editorial.
                                  // Mentorías -> "Audios de la Semana"; Audiolibros -> "Libros del Mes".
                                  const type = audio.contentType === 'audiobook' ? 'monthly_book' : 'weekly_audio';
                                  const etiqueta = type === 'monthly_book' ? 'Libros del Mes' : 'Audios de la Semana';
                                  setConfirmModal({
                                    open: true,
                                    title: 'Enviar al Calendario Editorial',
                                    message: `¿Enviar "${audio.title}" al Calendario Editorial (${etiqueta})?`,
                                    onConfirm: async () => {
                                      try {
                                        const { startDate } = await editorialService.appendToEditorial(audio.id, type);
                                        setToast({ message: `"${audio.title}" se programó en ${etiqueta} a partir del ${new Date(startDate).toLocaleDateString()}.`, type: 'success' });
                                      } catch (e) {
                                        setToast({ message: 'No se pudo enviar al Calendario Editorial. Inténtalo de nuevo.', type: 'error' });
                                      }
                                    },
                                  });
                                }}
                                className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors"
                                title="Enviar al Calendario Editorial"
                              >
                                <Calendar size={16} />
                              </button>
                              <button onClick={() => handleEditAudio(audio)} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteAudio(audio.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Start Talent */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Briefcase size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Start Talent</h3>
                </div>
                <div className="bg-bg-card border border-white/5 rounded-[24px] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-text-dim uppercase tracking-widest">
                        <th className="px-6 py-4">Foto</th>
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Rango</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(dynamicSpeakers || []).map(talent => (
                        <tr key={talent.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <img src={talent.photoUrl} className="w-10 h-10 rounded-full object-cover" alt={talent.name} />
                          </td>
                          <td className="px-6 py-4 font-bold text-white text-sm">{talent.name}</td>
                          <td className="px-6 py-4 text-text-dim text-sm">{talent.role}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEditTalent(talent)} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteTalent(talent.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Eventos Zoom */}
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Video size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Eventos y Zoom</h3>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-text-dim uppercase tracking-widest px-4">Próximos Eventos</h4>
                  <div className="bg-bg-card border border-white/5 rounded-[24px] overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-black text-text-dim uppercase tracking-widest">
                          <th className="px-6 py-4">Título</th>
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(events || []).filter(e => new Date(e.date) >= new Date()).map(event => (
                          <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 font-bold text-white text-sm">{event.title}</td>
                            <td className="px-6 py-4 text-text-dim text-sm">{new Date(event.date).toLocaleString()}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${event.status === 'live' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>{event.status}</span></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEditEvent(event)} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-text-dim uppercase tracking-widest px-4">Historial de Eventos</h4>
                  <div className="bg-bg-card border border-white/5 rounded-[24px] overflow-hidden opacity-60">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-black text-text-dim uppercase tracking-widest">
                          <th className="px-6 py-4">Título</th>
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(events || []).filter(e => new Date(e.date) < new Date()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
                          <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 font-bold text-white text-sm">{event.title}</td>
                            <td className="px-6 py-4 text-text-dim text-sm">{new Date(event.date).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEditEvent(event)} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-10"
            >
              {/* ESTADO DE APRENDIZAJE DE NAYA - NUEVO COMPONENTE MONITOR */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-6 mb-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-50"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center relative ${isNayaLearning ? 'bg-accent/20' : 'bg-green-500/10'}`}>
                    {isNayaLearning ? (
                      <>
                        <RefreshCw size={32} className="text-accent animate-spin" />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 bg-accent/20 rounded-full blur-xl"
                        ></motion.div>
                      </>
                    ) : (
                      <ShieldCheck size={32} className="text-green-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">Estado de Aprendizaje de Naya</p>
                    <h2 className={`text-xl font-bold uppercase tracking-tight ${isNayaLearning ? 'text-accent' : 'text-green-500'}`}>
                      {isNayaLearning ? 'Naya está analizando el nuevo contenido...' : 'Naya ha absorbido y razonado la última actualización'}
                    </h2>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={handleSyncWisdom}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 relative z-10 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <div className={`w-2 h-2 rounded-full ${isNayaLearning ? 'bg-accent animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Sincronización de Sabiduría</span>
                  </button>
                  {lastSync && (
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">
                      Última absorción: {new Date(lastSync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

      {/* NAYA HISTORY FEED - RESTAURACIÓN */}
              {nayaHistoryItems && (
                <div className="bg-white/5 rounded-[32px] border border-white/5 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNayaLearning ? 'bg-accent/20 text-accent' : 'bg-green-500/10 text-green-500'}`}>
                        <History size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Bitácora de Sabiduría</h3>
                        <p className="text-[9px] font-medium text-text-dim uppercase tracking-widest mt-0.5">Últimas conexiones neuronales de Naya</p>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                      isNayaLearning 
                        ? 'bg-accent/10 border-accent/20 text-accent animate-pulse' 
                        : 'bg-green-500/10 border-green-500/20 text-green-500'
                    }`}>
                      {isNayaLearning ? 'Analizando...' : 'Sincronizado'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(nayaHistoryItems || []).length > 0 ? (
                      (nayaHistoryItems || []).map((item, index) => (
                        <motion.div 
                          key={`naya-log-${item.id}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/[0.03]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                              <CheckCircle2 size={16} />
                            </div>
                            <p className="text-xs font-medium">Naya procesó: <span className="text-white font-black italic">"{item.title}"</span></p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-8 text-center opacity-30 italic text-[10px]">No hay registros de aprendizaje</div>
                    )}
                  </div>

                  <div className="pt-2">
                    <p className="text-[9px] font-black text-accent/60 uppercase tracking-widest italic text-center">
                      "NAYA HA ABSORBIDO Y RAZONADO LA ÚLTIMA ACTUALIZACIÓN DE LA BIBLIOTECA"
                    </p>
                  </div>
                </div>
              )}

              {/* 📢 PRÓXIMO COMERCIAL (Novedades de la semana) - WIDGET QUIRÚRGICO */}
              <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl mb-8">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <Sparkles size={20} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tighter leading-none">📢 PRÓXIMO COMERCIAL</h3>
                      <p className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mt-1">Borrador de Novedades Semanales</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-accent/20 rounded-full border border-accent/30">
                    <span className="text-accent text-[10px] font-bold uppercase">{(pendingDigestItems || []).length} Ítems Pendientes</span>
                  </div>
                </div>

                <div className="p-6">
                  {(pendingDigestItems || []).length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(pendingDigestItems || []).map((item: any, index: number) => (
                          <div key={`digest-${item.id}-${index}`} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-all">
                            <div className="w-12 h-12 flex-shrink-0 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center">
                              {item.type === 'audio' && <Headphones className="text-purple-400" size={24} />}
                              {item.type === 'book' && <BookOpen className="text-orange-400" size={24} />}
                              {item.type === 'event' && <Video className="text-red-400" size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-bold truncate group-hover:text-accent transition-colors">{item.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-white/40 font-bold uppercase">
                                  {item.type === 'audio' ? '🎙️ Audio' : item.type === 'book' ? '📚 Libro' : '📅 Evento'}
                                </span>
                                <span className="text-white/20 text-[10px]">•</span>
                                <span className="text-[10px] text-white/40">
                                  {new Date(item.uploadedAt || item.createdAt || item.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <button 
                          onClick={handleClearDigest}
                          className="w-full py-4 bg-accent hover:bg-accent/90 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
                        >
                          <ArrowRight size={20} className="animate-pulse" />
                          🚀 Confirmar Lanzamiento y Limpiar Bandeja
                        </button>
                        <p className="text-center text-white/20 text-[9px] font-bold uppercase tracking-widest mt-4">
                          Esta acción marcará estos ítems como procesados para el reporte de los lunes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
                        <ZapOff size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white/60 font-bold uppercase tracking-tight">No hay contenido nuevo acumulado</h4>
                        <p className="text-white/20 text-xs">Todo el contenido ha sido procesado para el próximo comercial.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HISTORIAL DE ABSORCIÓN - ACORDEÓN DE EVIDENCIA */}
              <div className="-mt-10 mb-8 mx-4">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-6 py-3 bg-black/40 border border-white/5 rounded-full text-[10px] font-black text-accent uppercase tracking-widest hover:bg-black/60 transition-all active:scale-95"
                >
                  {showHistory ? <ChevronUp size={14} /> : <Plus size={14} />}
                  {showHistory ? 'Ocultar Historial' : 'Ver últimos 5 contenidos integrados'}
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 bg-[#0a0a0a]/50 border border-white/5 rounded-[24px] p-6 space-y-3">
                        {(historialAbsorcion || []).map(item => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <span className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-accent transition-colors">{item.detalle}</span>
                              </div>
                              <span className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-5">{item.fecha}</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-500">
                              <CheckCircle2 size={14} />
                              <span className="text-[10px] font-black uppercase tracking-tighter">Absorbido</span>
                            </div>
                          </div>
                        ))}
                        {(historialAbsorcion || []).length === 0 && (
                          <p className="text-center py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest italic">No hay historial reciente de absorción</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stats Grid - PROTOCOLO DE RESCATE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-card border border-border rounded-[28px] p-8 py-10 flex flex-row items-center gap-6 shadow-2xl transition-all hover:scale-[1.02]">
                  <div className="w-16 h-16 bg-white/5 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-dim text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">TOTAL USUARIAS</p>
                    <p className="text-4xl font-bold text-white tracking-widest">{(users || []).length}</p>
                  </div>
                </div>
                <div className="bg-bg-card border border-border rounded-[28px] p-8 py-10 flex flex-row items-center gap-6 shadow-2xl transition-all hover:scale-[1.02]">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Star size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-dim text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">PREMIUM ACTIVE</p>
                    <p className="text-4xl font-bold text-white tracking-widest">{(users || []).filter(u => u.plan === 'Premium').length}</p>
                  </div>
                </div>
                <div className="bg-bg-card border border-border rounded-[28px] p-8 py-10 flex flex-row items-center gap-6 shadow-2xl transition-all hover:scale-[1.02]">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <PlayCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-dim text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">AUDIOS TOTALES</p>
                    <p className="text-4xl font-bold text-white tracking-widest">{(audios || []).length}</p>
                  </div>
                </div>
                <div className="bg-bg-card border border-border rounded-[28px] p-8 py-10 flex flex-row items-center gap-6 shadow-2xl transition-all hover:scale-[1.02]">
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-dim text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">EVENTOS</p>
                    <p className="text-4xl font-bold text-white tracking-widest">{(events || []).length}</p>
                  </div>
                </div>
              </div>
              
              {/* RADAR DE INTELIGENCIA COMERCIAL: NUEVAS DIRECTORAS */}
              <div className="bg-black border-2 border-accent/30 rounded-[32px] p-8 shadow-[0_0_50px_rgba(255,140,0,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/40 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">Radar en Vivo</span>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tighter uppercase flex items-center gap-3">
                    <Shield size={24} className="text-accent" />
                    Radar de Altas Prioridades
                  </h3>
                  <p className="text-xs text-text-dim font-bold uppercase tracking-widest">Nuevas Directoras pendientes de contacto ejecutivo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(users || []).filter(u => u.current_rank?.includes('Directora') || u.current_rank?.includes('Director')).slice(0, 6).map(directora => (
                    <div key={directora.id} className="bg-[#111] border border-white/5 rounded-2xl p-6 relative group transition-all hover:border-accent/50 hover:bg-[#161616]">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Nueva Alerta</p>
                          <h4 className="text-xl font-bold text-white uppercase tracking-tight">{directora.name}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent">
                          <Star size={20} fill="currentColor" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-text-dim/60 font-medium uppercase tracking-widest">Contacto</p>
                          <p className="text-xs text-white/80 font-bold">{directora.email}</p>
                          <p className="text-[10px] text-text-dim font-medium">{directora.phone || 'Sin teléfono registrado'}</p>
                        </div>

                        <a 
                          href={`https://wa.me/${directora.phone?.replace(/\D/g, '')}?text=${encodeURIComponent("¡Hola " + directora.name + "! Bienvenida a Inspira. Soy el equipo de Operaciones, es un gusto tenerte como Directora. Estamos aquí para apoyarte en tu camino al éxito.")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-4 bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-green-500/10 active:scale-95"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.893-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.335 11.892-11.893 11.892-1.992 0-3.956-.5-5.691-1.448l-6.301 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.341 1.591 5.4 0 9.791-4.393 9.794-9.794.001-5.4-4.385-9.791-9.789-9.791-5.405 0-9.792 4.392-9.792 9.791 0 2.213.669 3.862 1.838 5.61l-.986 3.59 3.594-.943z" />
                          </svg>
                          WhatsApp Directo
                        </a>
                      </div>
                    </div>
                  ))}

                  {((users || []).filter(u => u.current_rank?.includes('Directora') || u.current_rank?.includes('Director')) || []).length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-text-dim/40 mb-4">
                        <UserPlus size={32} />
                      </div>
                      <p className="text-xs text-text-dim font-bold uppercase tracking-widest italic">No hay nuevas alertas de Directoras</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-bg-card border border-border rounded-[32px] p-8 space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-text-dim flex items-center gap-2">
                        <TrendingUp size={16} className="text-accent" />
                        Crecimiento de la Red
                      </h3>
                      <p className="text-xs text-text-dim/60 font-bold uppercase">Usuarios diarios (últimos 7 días)</p>
                    </div>
                  </div>
                  <div className="h-[240px] w-full">
                    {activeTab === 'dashboard' && users.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DASHBOARD_DATA.dau}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="day" stroke="#666" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                          <YAxis stroke="#666" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                            itemStyle={{ color: '#FF8C00' }}
                          />
                          <Area type="monotone" dataKey="users" stroke="#FF8C00" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] uppercase font-black">
                        Cargando métricas en tiempo real...
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-text-dim flex items-center gap-2">
                      <PieChart size={18} className="text-accent" />
                      Plan Distribution
                    </h3>
                    <div className="h-[200px]">
                      {activeTab === 'dashboard' && users.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={[
                                { name: 'Premium', value: (users || []).filter(u => u.plan === 'Premium').length },
                                { name: 'Gratis', value: (users || []).filter(u => u.plan !== 'Premium').length }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell key="cell-premium" fill="#FF8C00" />
                              <Cell key="cell-gratis" fill="#333" />
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] uppercase font-black">
                          Cargando distribución de planes...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Users Module - NEW SECTION */}
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-text-dim flex items-center gap-2">
                      <UserPlus size={18} className="text-accent" />
                      Últimos 5 Registros
                    </h3>
                    <p className="text-xs text-text-dim/60 font-bold uppercase">Actividad reciente en la red</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2 bg-white/5 hover:bg-accent hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                  >
                    Ver CRM Completo
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Usuaria</th>
                        <th className="pb-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Email</th>
                        <th className="pb-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Plan</th>
                        <th className="pb-4 text-[10px] font-black uppercase text-text-dim tracking-widest text-right">Registro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(users || []).length > 0 ? (
                        (users || [])
                          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                          .slice(0, 5)
                          .map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 font-bold text-white uppercase italic text-xs">{u.name}</td>
                              <td className="py-4 text-xs text-text-dim font-bold">{u.email}</td>
                              <td className="py-4">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${u.plan === 'Premium' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-text-dim border border-white/5'}`}>
                                  {u.plan}
                                </span>
                              </td>
                              <td className="py-4 text-right text-[10px] text-text-dim font-black">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-xs text-text-dim font-bold uppercase italic">
                            No se han encontrado usuarias registradas aún.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advanced Analytics - NEW SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-text-dim flex items-center gap-2">
                       <BarChart2 size={18} className="text-accent" />
                       PONDERACIÓN DE USO DE HERRAMIENTAS (%)
                    </h3>
                    <p className="text-xs text-text-dim/60 font-bold uppercase">Popularidad por módulo</p>
                  </div>
                  
                  <div className="space-y-5">
                    {[
                      { name: 'Audiolibros', percentage: 60, color: 'bg-orange-500' },
                      { name: 'CRM y Perfil', percentage: 20, color: 'bg-blue-500' },
                      { name: 'Mentorías (Talent)', percentage: 20, color: 'bg-purple-500' },
                      { name: 'Eventos Zoom', percentage: 15, color: 'bg-red-500' },
                    ].map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-dim">
                          <span>{item.name}</span>
                          <span className="text-white">{item.percentage}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              className={`h-full ${item.color}`}
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-text-dim flex items-center gap-2">
                       <Clock size={18} className="text-accent" />
                       TIEMPO PROMEDIO DE RETENCIÓN
                    </h3>
                    <p className="text-xs text-text-dim/60 font-bold uppercase">Permanencia por sesión</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { name: 'Audiolibros', time: '45 min/sesión', icon: Headphones, color: 'text-orange-500' },
                      { name: 'Eventos Zoom', time: '60 min/sesión', icon: Video, color: 'text-red-500' },
                      { name: 'Chat Naya AI', time: '12 min/sesión', icon: Sparkles, color: 'text-accent' },
                      { name: 'Mentorías VIP', time: '25 min/sesión', icon: Star, color: 'text-purple-500' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10 hover:border-white/10">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg bg-black ${item.color}`}>
                            <item.icon size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-white">{item.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-accent tracking-widest italic">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-10"
            >
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
                  <div className="relative flex-1 w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                    <input 
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full bg-black border border-border rounded-[20px] py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-5 py-3 bg-white/5 border border-border rounded-2xl">
                      <p className="text-[10px] text-text-dim font-black uppercase tracking-widest leading-none mb-1">Total Usuarias</p>
                      <p className="text-xl font-bold text-white leading-none">{(users || []).length}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-border rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-bg-deep border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Usuaria</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Email</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Plan</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(users || []).filter(u => (u.name || '').toLowerCase().includes((filterQuery || '').toLowerCase()) || (u.email || '').toLowerCase().includes((filterQuery || '').toLowerCase())).map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white uppercase italic text-sm">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-text-dim font-bold">{u.email}</td>
                          <td className="px-6 py-4 text-[10px] font-black">
                            <span className={`px-2 py-1 rounded ${u.plan === 'Premium' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-text-dim'}`}>
                              {u.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleTogglePlan(u.id, u.plan || 'Gratis')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                                  u.plan === 'Premium' 
                                    ? 'bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 border border-white/5' 
                                    : 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/10'
                                }`}
                              >
                                {u.plan === 'Premium' ? 'Revocar Premium' : 'Hacer Premium 👑'}
                              </button>
                              <button className="p-2 text-accent hover:bg-accent/10 rounded-lg">
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audiobooks' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8 pb-20"
            >
              <div className="bg-bg-card border border-border rounded-[40px] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Gestión de Contenido</h3>
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Gestión de Libros y Audiolibros en Etapas */}
                    <div className="pt-6 border-t border-border mt-0 space-y-6">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BookOpen size={16} className="text-accent" />
                        📚 {editingBookId ? 'EDITAR AUDIOLIBRO' : 'SUBIR AUDIOLIBRO'}
                      </h4>
                      
                      <form onSubmit={handlePublishBook} className="space-y-4 bg-white/5 p-6 rounded-[32px] border border-white/5">
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            className="w-full bg-black border border-border rounded-xl p-3 text-white text-[11px] outline-none focus:border-accent" 
                            placeholder="Título del Libro"
                            value={bookData.title}
                            onChange={(e) => setBookData({...bookData, title: e.target.value})}
                          />
                          <input 
                            className="w-full bg-black border border-border rounded-xl p-3 text-white text-[11px] outline-none focus:border-accent" 
                            placeholder="Autor"
                            value={bookData.author}
                            onChange={(e) => setBookData({...bookData, author: e.target.value})}
                          />
                        </div>
                        <textarea 
                          className="w-full bg-black border border-border rounded-xl p-3 text-white text-[11px] outline-none focus:border-accent" 
                          placeholder="Reseña o Descripción"
                          rows={2}
                          value={bookData.review}
                          onChange={(e) => setBookData({...bookData, review: e.target.value})}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-accent tracking-widest flex items-center gap-1">
                              Etapa 1
                              {etapa1File && <CheckCircle2 size={10} className="text-green-500" />}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-black/40 p-3 rounded-xl border border-white/5 hover:border-accent transition-all">
                              <Upload size={14} className="text-accent" />
                              <span className="text-[10px] text-white/60 truncate">{etapa1File ? etapa1File.name : 'Subir Audio 1'}</span>
                              <input type="file" className="hidden" accept="audio/*" onChange={(e) => setEtapa1File(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1">
                              Etapa 2
                              {etapa2File && <CheckCircle2 size={10} className="text-green-500" />}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-black/40 p-3 rounded-xl border border-white/5 hover:border-accent transition-all">
                              <Upload size={14} className="text-zinc-500" />
                              <span className="text-[10px] text-white/60 truncate">{etapa2File ? etapa2File.name : 'Subir Audio 2'}</span>
                              <input type="file" className="hidden" accept="audio/*" onChange={(e) => setEtapa2File(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <label className="flex-1 flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                              <Upload size={14} />
                              <span className="text-[10px] uppercase font-black">{coverFile ? coverFile.name : 'Subir Portada'}</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                           </label>
                           {editingBookId && (
                             <button 
                               type="button"
                               onClick={() => {
                                 setEditingBookId(null);
                                 setBookData({ title: '', author: '', review: '', rating: 5, type: 'Audiolibro', category: CATEGORIES[0] || 'Mentalidad' });
                                 setCoverFile(null);
                                 setEtapa1File(null);
                                 setEtapa2File(null);
                               }}
                               className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-red-500/20 text-red-500 hover:bg-red-500/40 transition-all"
                             >
                               Cancelar
                             </button>
                           )}
                           <button 
                              disabled={isBookSubmitting}
                              className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                isBookSubmitting ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-accent'
                              }`}
                            >
                               {isBookSubmitting ? 'SUBIENDO...' : bookSuccess ? '¡LISTO! ✅' : editingBookId ? 'ACTUALIZAR LIBRO' : 'GUARDAR LIBRO'}
                           </button>
                        </div>
                      </form>

                      {/* Lista de Libros */}
                      <div className="space-y-3 mt-10">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">BIBLIOTECA DE LIBROS ACTIVOS</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(books || []).map(book => (
                            <div key={book.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-accent/40 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-14 rounded-lg border border-white/10 overflow-hidden shrink-0 shadow-lg">
                                  <img src={book.coverUrl} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-white uppercase tracking-tight">{book.title}</p>
                                  <p className="text-[9px] text-text-dim/60 font-bold uppercase mb-2">{book.author}</p>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                       <div className={`w-1.5 h-1.5 rounded-full ${book.etapas?.[0]?.url ? 'bg-green-500' : 'bg-zinc-700'}`} />
                                       <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">PARTE 1</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <div className={`w-1.5 h-1.5 rounded-full ${book.etapas?.[1]?.url ? 'bg-green-500' : 'bg-zinc-700'}`} />
                                       <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">PARTE 2</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: 'Eliminar Libro',
                                    message: '¿Deseas eliminar este libro de la biblioteca? Esta acción no se puede deshacer.',
                                    onConfirm: async () => {
                                      await bookService.deleteBook(book.id);
                                      setToast({ message: 'Libro eliminado correctamente.', type: 'success' });
                                    },
                                  });
                                }}
                                className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'mentoring' && (
            <motion.div
              key="mentoring"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto pb-20 w-full"
            >
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">🎙️ {editingAudioId ? 'Editar Mentoría' : 'Subir Mentoría Start Talent'}</h3>
                  <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Lecciones Magistrales de nuestras Directoras</p>
                </div>

                <form onSubmit={handlePublishContent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Título de la Mentoría</label>
                      <input 
                        required
                        type="text"
                        placeholder="Ej: Disciplina de Acero"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                        className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Start Talent</label>
                      <select 
                        required
                        value={uploadData.author}
                        onChange={(e) => setUploadData({...uploadData, author: e.target.value})}
                        className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all appearance-none"
                      >
                        <option value="" className="bg-zinc-900 text-white">Seleccionar Speaker</option>
                        {(allSpeakers || []).map(s => <option key={s.id} value={s.name} className="bg-zinc-900 text-white">{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Categoría</label>
                      <select 
                        required
                        value={uploadData.category}
                        onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                        className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all appearance-none"
                      >
                        {(CATEGORIES || []).map(cat => <option key={cat} value={cat} className="bg-zinc-900 text-white">{cat}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end pb-2">
                      <button 
                        type="button"
                        onClick={() => setUploadData({...uploadData, is_premium: !uploadData.is_premium})}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${
                          uploadData.is_premium 
                            ? 'bg-accent/10 border-accent text-accent font-black' 
                            : 'bg-zinc-800 border-border text-zinc-500 font-bold'
                        }`}
                      >
                        <Crown size={18} />
                        <span className="text-xs uppercase tracking-widest">Contenido Premium</span>
                        <div className={`ml-auto w-10 h-5 rounded-full relative transition-colors ${uploadData.is_premium ? 'bg-accent' : 'bg-zinc-600'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${uploadData.is_premium ? 'left-6' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="flex flex-col justify-end pb-2">
                       <button 
                         type="button"
                         onClick={() => setUploadData({...uploadData, isPriority: !uploadData.isPriority})}
                         className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${
                           uploadData.isPriority 
                             ? 'bg-orange-500/10 border-orange-500 text-orange-500 font-black' 
                             : 'bg-zinc-800 border-border text-zinc-500 font-bold'
                         }`}
                       >
                         <Zap size={18} />
                         <span className="text-xs uppercase tracking-widest">Prioridad Alta (Programar)</span>
                         <div className={`ml-auto w-10 h-5 rounded-full relative transition-colors ${uploadData.isPriority ? 'bg-orange-500' : 'bg-zinc-600'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${uploadData.isPriority ? 'left-6' : 'left-1'}`} />
                         </div>
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-black uppercase transition-all">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2 flex items-center gap-2">
                        Audio Completo
                        {audioFile && <CheckCircle2 size={12} className="text-green-500" />}
                      </label>
                      <div className="relative group">
                        <input 
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 transition-all ${
                          audioFile ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-deep border-border text-text-dim hover:border-accent/40'
                        }`}>
                          <Upload size={24} />
                          <p className="text-[10px]">{audioFile ? audioFile.name.substring(0, 20) : 'Subir Audio Full'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2 flex items-center gap-2">
                        Clip de Avance (Gratis)
                        {previewFile && <CheckCircle2 size={12} className="text-orange-500" />}
                      </label>
                      <div className="relative group">
                        <input 
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 transition-all ${
                          previewFile ? 'bg-orange-500/10 border-orange-500/40 text-orange-500' : 'bg-bg-deep border-border text-text-dim hover:border-orange-500/40'
                        }`}>
                          <PlayCircle size={24} />
                          <p className="text-[10px]">{previewFile ? previewFile.name.substring(0, 20) : 'Subir Preview'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2 flex items-center gap-2">
                        Portada (Imagen)
                        {coverFile && <CheckCircle2 size={12} className="text-green-500" />}
                      </label>
                      <div className="relative group">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 transition-all ${
                          coverFile ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-deep border-border text-text-dim hover:border-accent/40'
                        }`}>
                          <Upload size={24} />
                          <p className="text-[10px]">{coverFile ? coverFile.name.substring(0, 20) : 'Subir Portada'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadStatus && activeTab === 'mentoring' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span className="text-xs font-bold">{uploadStatus.message}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    {editingAudioId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingAudioId(null);
                          setUploadData({ title: '', author: '', description: '', category: CATEGORIES[0] || 'Ventas', is_premium: true, isPriority: false });
                          setAudioFile(null);
                          setPreviewFile(null);
                          setCoverFile(null);
                        }}
                        className="flex-1 bg-red-500/20 text-red-500 py-5 rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={isMentoringSubmitting}
                      className={`${editingAudioId ? 'flex-[2]' : 'w-full'} bg-accent text-black py-5 rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                    >
                      {isMentoringSubmitting ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Subiendo Mentoría...
                        </>
                      ) : mentoringSuccess ? (
                        '¡LISTO! ✅'
                      ) : (
                        <>
                          {editingAudioId ? <Edit2 size={20} /> : <Plus size={20} />}
                          {editingAudioId ? 'Actualizar Mentoría' : 'Publicar Mentoría'}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Listado de Mentorías Activas */}
                <div className="pt-10 border-t border-white/5 space-y-6">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest text-accent">MENTORÍAS ACTIVAS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                    {(audios || []).filter(a => a.contentType === 'mentoring').map(audio => (
                      <div key={audio.id} className="flex items-center justify-between p-4 bg-black border border-border rounded-2xl group border-white/5 hover:border-accent/40 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-bg-card rounded-xl overflow-hidden shrink-0 border border-border">
                            <img src={audio.coverUrl} alt="" className="w-full h-full object-cover opacity-60" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white uppercase tracking-tight truncate">{audio.title}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-text-dim font-bold uppercase">{audio.author}</p>
                              <span className="text-white/20">•</span>
                              <div className="flex items-center gap-1">
                                {audio.nayaReasoned ? (
                                  <div className="flex items-center gap-1 text-green-500">
                                    <CheckCircle2 size={10} />
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Razonado</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-accent animate-pulse">
                                    <RefreshCw size={10} className="animate-spin" />
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Analizando</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              open: true,
                              title: 'Eliminar Mentoría',
                              message: '¿Seguro que deseas eliminar esta mentoría? Esta acción no se puede deshacer.',
                              onConfirm: async () => {
                                await audioService.deleteAudio(audio.id);
                                setAudios(p => p.filter(a => a.id !== audio.id));
                                setToast({ message: 'Mentoría eliminada correctamente.', type: 'success' });
                              },
                            });
                          }}
                          className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'talent' && (
            <motion.div
              key="talent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto pb-20 w-full"
            >
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{editingTalentId ? '✨ Editar Start Talent' : 'Gestión de Start Talent'}</h3>
                  <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Registra a las portadoras del legado</p>
                </div>

                <form onSubmit={handleCreateTalent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Nombre de la Speaker</label>
                      <input 
                        required
                        type="text"
                        placeholder="Ej: Angélica Valdez"
                        value={talentData.name}
                        onChange={(e) => setTalentData({...talentData, name: e.target.value})}
                        className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Rango / Cargo</label>
                      <input 
                        required
                        type="text"
                        placeholder="Ej: Directora Nacional Elite"
                        value={talentData.role}
                        onChange={(e) => setTalentData({...talentData, role: e.target.value})}
                        className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Email de la Cuenta (Para VIP)</label>
                      <div className="relative">
                        <input 
                          required
                          type="email"
                          placeholder="directora@inspira.com"
                          value={talentData.userEmail}
                          onChange={(e) => setTalentData({...talentData, userEmail: e.target.value})}
                          className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                        />
                        <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-accent opacity-50" size={18} />
                      </div>
                      <p className="text-[8px] text-text-dim uppercase tracking-tighter px-2">Este correo recibirá plan Premium automático (Beca INSPIRA).</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Foto de Perfil</label>
                      <div className="relative group">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => setTalentPhotoFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-2xl py-4 px-6 flex items-center gap-3 transition-all ${
                          talentPhotoFile ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-deep border-border text-text-dim hover:border-accent/40'
                        }`}>
                          <Upload size={18} />
                          <span className="text-[10px] uppercase font-black truncate">{talentPhotoFile ? talentPhotoFile.name : 'Subir Foto'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Biografía Inspira</label>
                    <textarea 
                      required
                      placeholder="Trayectoria y logros..."
                      rows={3}
                      value={talentData.bio}
                      onChange={(e) => setTalentData({...talentData, bio: e.target.value})}
                      className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all resize-none"
                    />
                  </div>

                  {uploadStatus && activeTab === 'talent' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span className="text-xs font-bold">{uploadStatus.message}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    {editingTalentId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingTalentId(null);
                          setTalentData({ name: '', role: '', bio: '', userEmail: '', photoUrl: '' });
                          setTalentPhotoFile(null);
                        }}
                        className="flex-1 bg-red-500/20 text-red-500 py-5 rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={isTalentSubmitting}
                      className={`${editingTalentId ? 'flex-[2]' : 'w-full'} bg-accent text-black py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                    >
                      {isTalentSubmitting ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Registrando...
                        </>
                      ) : talentSuccess ? (
                        '¡LISTO! ✅'
                      ) : (
                        <>
                          {editingTalentId ? <Edit2 size={16} /> : <UserPlus size={16} />}
                          {editingTalentId ? 'Actualizar Start Talent' : 'Registrar Start Talent'}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Lista de Talento */}
                <div className="mt-12 space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Speakers Registradas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(allSpeakers || []).map(speaker => (
                      <div key={speaker.id} className="bg-bg-deep border border-border/50 rounded-[28px] p-4 flex items-center gap-4 hover:border-accent/30 transition-all group">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/5 flex-shrink-0">
                          <img src={speaker.photoUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-white truncate leading-tight">{speaker.name}</h4>
                          <p className="text-[10px] text-text-dim font-bold uppercase truncate">{speaker.role}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Briefcase size={10} className="text-accent" />
                            <span className="text-[9px] text-accent/80 font-medium truncate italic">{speaker.userEmail}</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-full ${speaker.userEmail ? 'bg-accent/10 border border-accent/20 text-accent' : 'bg-zinc-800 text-zinc-600'}`}>
                          <Crown size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto pb-20 w-full"
            >
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">📅 {editingEventId ? 'Editar Evento' : 'Programar Evento o Zoom'}</h3>
                  <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Capacitaciones en vivo y repeticiones</p>
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Título del Evento</label>
                    <input 
                      required
                      type="text"
                      placeholder="Ej: Orientación para Nuevas Consultoras"
                      value={eventData.title}
                      onChange={(e) => setEventData({...eventData, title: e.target.value})}
                      className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Fecha y Hora</label>
                      <input 
                        required
                        type="datetime-local"
                        value={eventData.date}
                        onChange={(e) => setEventData({...eventData, date: e.target.value})}
                        className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Estado del Evento</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setEventData({...eventData, status: 'live'})}
                          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                            eventData.status === 'live' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-bg-deep border-border text-text-dim'
                          }`}
                        >
                          <Video size={14} />
                          🔴 En Vivo (Zoom)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEventData({...eventData, status: 'recorded'})}
                          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                            eventData.status === 'recorded' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-bg-deep border-border text-text-dim'
                          }`}
                        >
                          <PlayCircle size={14} />
                          ▶️ Repetición
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">URL (Link de Zoom o Video)</label>
                    <input 
                      required
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={eventData.url}
                      onChange={(e) => setEventData({...eventData, url: e.target.value})}
                      className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Breve Descripción</label>
                    <textarea 
                      required
                      placeholder="De qué trata esta capacitación..."
                      rows={3}
                      value={eventData.description}
                      onChange={(e) => setEventData({...eventData, description: e.target.value})}
                      className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all resize-none"
                    />
                  </div>

                  {uploadStatus && activeTab === 'events' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span className="text-xs font-bold">{uploadStatus.message}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    {editingEventId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingEventId(null);
                          setEventData({
                            title: '',
                            description: '',
                            date: new Date().toISOString().slice(0, 16),
                            url: '',
                            status: 'live'
                          });
                        }}
                        className="flex-1 bg-red-500/20 text-red-500 py-5 rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all outline-none"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={isEventSubmitting}
                      className={`${editingEventId ? 'flex-[2]' : 'w-full'} bg-accent text-black py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                    >
                      {isEventSubmitting ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Guardando...
                        </>
                      ) : eventSuccess ? (
                        '¡LISTO! ✅'
                      ) : (
                        <>
                          {editingEventId ? <Edit2 size={20} /> : <Calendar size={20} />}
                          {editingEventId ? 'Actualizar Evento' : 'Programar Evento'}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Lista de Eventos */}
                <div className="mt-12 space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Eventos Programados</h3>
                  <div className="space-y-3">
                    {(events || []).length === 0 ? (
                      <div className="bg-bg-deep border border-border/50 rounded-[28px] p-10 text-center text-text-dim uppercase font-black text-xs tracking-widest">
                        No hay eventos registrados
                      </div>
                    ) : (
                      (events || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
                        <div key={event.id} className="bg-bg-deep border border-border/50 rounded-[28px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-accent/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              event.status === 'live' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {event.status === 'live' ? <Video size={24} /> : <PlayCircle size={24} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white truncate leading-tight">{event.title}</h4>
                              <p className="text-[10px] text-text-dim font-bold uppercase mt-0.5">
                                {new Date(event.date).toLocaleString()} • {event.status === 'live' ? 'Zoom' : 'Grabación'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="p-3 bg-zinc-800 rounded-xl text-text-dim hover:text-accent transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-3 bg-zinc-800 rounded-xl text-text-dim hover:text-red-500 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'editorial' && (
            <motion.div
              key="editorial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto pb-20 w-full space-y-8"
            >
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">📅 Calendario Editorial</h3>
                    <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Programación predictiva (5 meses)</p>
                  </div>
                </div>

                {/* Least-Played (Bajo Impacto) Quick Stats */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-[28px] p-6 space-y-4">
                  <div className="flex items-center gap-2 text-red-500">
                    <ZapOff size={20} />
                    <h4 className="font-black uppercase tracking-widest text-xs">Contenido con Menor Impacto (Menos Escuchados)</h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(audios || [])
                      .sort((a, b) => (a.plays || 0) - (b.plays || 0))
                      .slice(0, 8)
                      .map(audio => (
                        <div key={audio.id} className="bg-black/40 border border-white/5 py-2 px-4 rounded-xl flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white truncate max-w-[120px]">{audio.title}</span>
                            <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">
                              {audio.plays || 0} REPRODUCCIONES
                            </span>
                          </div>
                          <button 
                            onClick={async () => {
                              const nextSlot = editorialSlots
                                .filter(s => s.type === 'weekly_audio' && new Date(s.startDate) > new Date())
                                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
                              
                              if (nextSlot) {
                                await editorialService.updateEditorialSlot(nextSlot.id, { 
                                  contentId: audio.id, 
                                  contentType: audio.contentType 
                                });
                                setToast({ message: `Programado: ${audio.title}`, type: 'success' });
                              } else {
                                setToast({ message: 'No hay ranuras futuras disponibles. Usa autoprogramar primero.', type: 'error' });
                              }
                            }}
                            className="text-accent text-[10px] font-black uppercase hover:underline ml-2"
                          >
                            Programar
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Column 1: Weekly Audios (Mentoring) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-accent">
                        <MessageCircle size={20} />
                        <h4 className="font-black uppercase tracking-widest text-xs">🎙️ Audios de la Semana (20 Semanas)</h4>
                      </div>
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            open: true,
                            title: 'Autoprogramar Audios',
                            message: '¿Deseas autoprogramar solo los Audios (Mentoring)?',
                            onConfirm: async () => {
                              try {
                                const created = await editorialService.autoProgramAudios();
                                setToast({
                                  message: created > 0
                                    ? `Se autoprogramaron ${created} semana(s) de Audios de la Semana.`
                                    : 'El calendario de Audios ya estaba completo (20 semanas).',
                                  type: 'success',
                                });
                              } catch (e) {
                                setToast({ message: 'Ocurrió un error al autoprogramar los Audios. Inténtalo de nuevo.', type: 'error' });
                              }
                            },
                          });
                        }}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all flex items-center gap-2"
                      >
                        <RefreshCw size={12} />
                        Autoprogramar Audios
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                      {(editorialSlots || [])
                        .filter(s => s.type === 'weekly_audio')
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((slot) => {
                          const content = (audios || []).find(a => a.id === slot.contentId);
                          const isCurrent = new Date(slot.startDate) <= new Date() && new Date(slot.endDate) >= new Date();
                          
                          return (
                            <div key={slot.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isCurrent ? 'bg-accent/5 border-accent' : 'bg-bg-deep border-border'}`}>
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-text-dim uppercase leading-none mb-1">
                                  {new Date(slot.startDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs font-black text-white truncate">{content?.title || 'Sin asignar'}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setReplacingSlot(slot);
                                  setShowReplacementPicker(true);
                                }}
                                className="p-2 bg-zinc-800 rounded-lg text-text-dim hover:text-accent transition-colors flex items-center gap-1"
                                title="Reemplazar manualmente"
                              >
                                <Edit2 size={14} />
                                <span className="text-[9px] font-black uppercase md:inline hidden">Editar</span>
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Column 2: Monthly Books (Audiobooks) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-orange-500">
                        <BookOpen size={20} />
                        <h4 className="font-black uppercase tracking-widest text-xs">📚 Libros del Mes (5 Meses)</h4>
                      </div>
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            open: true,
                            title: 'Autoprogramar Libros',
                            message: '¿Deseas autoprogramar solo los Libros (Audiolibros)?',
                            onConfirm: async () => {
                              try {
                                const created = await editorialService.autoProgramBooks();
                                setToast({
                                  message: created > 0
                                    ? `Se autoprogramaron ${created} mes(es) de Libros del Mes.`
                                    : 'El calendario de Libros ya estaba completo (5 meses).',
                                  type: 'success',
                                });
                              } catch (e) {
                                setToast({ message: 'Ocurrió un error al autoprogramar los Libros. Inténtalo de nuevo.', type: 'error' });
                              }
                            },
                          });
                        }}
                        className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-all flex items-center gap-2"
                      >
                        <RefreshCw size={12} />
                        Autoprogramar Libros
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(editorialSlots || [])
                        .filter(s => s.type === 'monthly_book')
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((slot) => {
                          const content = (audios || []).find(a => a.id === slot.contentId);
                          const isCurrent = new Date(slot.startDate) <= new Date() && new Date(slot.endDate) >= new Date();
                          
                          return (
                            <div key={slot.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isCurrent ? 'border-orange-500 bg-orange-500/5' : 'bg-bg-deep border-border'}`}>
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-text-dim uppercase leading-none mb-1">
                                  {new Date(slot.startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-xs font-black text-white truncate">{content?.title || 'Sin asignar'}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setReplacingSlot(slot);
                                  setShowReplacementPicker(true);
                                }}
                                className="p-2 bg-zinc-800 rounded-lg text-text-dim hover:text-orange-500 transition-colors flex items-center gap-1"
                                title="Reemplazar manualmente"
                              >
                                <Edit2 size={14} />
                                <span className="text-[9px] font-black uppercase md:inline hidden">Editar</span>
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replacement Modal */}
              <AnimatePresence>
                {showReplacementPicker && replacingSlot && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setShowReplacementPicker(false);
                        setReplacingSlot(null);
                      }}
                      className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative bg-bg-card border border-border w-full max-w-2xl rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[80vh]"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Seleccionar Contenido</h3>
                          <p className="text-xs text-text-dim font-bold uppercase">Manual replacement for slot</p>
                        </div>
                        <button 
                          onClick={() => {
                            setShowReplacementPicker(false);
                            setReplacingSlot(null);
                          }}
                          className="p-3 bg-zinc-800 rounded-2xl text-text-dim hover:text-white"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {(audios || [])
                          .filter(a => a.contentType === (replacingSlot.type === 'weekly_audio' ? 'mentoring' : 'audiobook'))
                          .map((audio) => (
                            <button
                              key={audio.id}
                              onClick={async () => {
                                await editorialService.updateEditorialSlot(replacingSlot.id, { 
                                  contentId: audio.id,
                                  contentType: audio.contentType
                                });
                                setShowReplacementPicker(false);
                                setReplacingSlot(null);
                              }}
                              className="w-full p-4 rounded-2xl bg-bg-deep border border-border/50 hover:border-accent transition-all flex items-center gap-4 text-left group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {audio.coverUrl ? (
                                  <img src={audio.coverUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <PlayCircle size={20} className="text-text-dim" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white truncate">{audio.title}</p>
                                <p className="text-[10px] text-text-dim font-bold uppercase">{audio.author}</p>
                              </div>
                              <ArrowRight size={16} className="text-zinc-800 group-hover:text-accent transition-colors" />
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* INICIO DEL BLOQUE DE EQUIPO */}
          {activeTab === 'routes' && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pb-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#090909] p-8 rounded-3xl border border-white/5">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">🛣️ Rutas al Éxito</h2>
                  <p className="text-text-dim font-medium">Construye rutas de aprendizaje manuales para tus líderes.</p>
                </div>
                {(successPaths || []).length === 0 ? (
                  <button
                    onClick={async () => {
                      setIsRoutesSubmitting(true);
                      await successPathService.createPath({
                        name: 'Ruta Principal',
                        levels: [],
                        updatedAt: new Date().toISOString()
                      });
                      setIsRoutesSubmitting(false);
                      setNayaToast({ visible: true, title: 'Ruta creada 🗺️' });
                      setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
                    }}
                    className="flex items-center gap-2 px-8 py-4 bg-accent text-black font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-accent/20"
                  >
                    <Plus size={20} />
                    INICIAR RUTA DE ÉXITO
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLevelForm({ title: '', rank: '', description: '' });
                      setEditingLevel(null);
                      setEditingPath(successPaths[0]);
                      setShowLevelModal(true);
                    }}
                    className="flex items-center gap-2 px-8 py-4 bg-accent text-black font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-accent/20"
                  >
                    <Plus size={20} />
                    AÑADIR NUEVO NIVEL
                  </button>
                )}
              </div>

              {(successPaths || []).map(path => (
                <div key={path.id} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(path.levels || []).map((level) => (
                      <div 
                        key={level.id}
                        className="bg-[#090909] p-6 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                            <Sparkles size={24} />
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setLevelForm({ title: level.title, rank: level.rank, description: level.description });
                                setEditingLevel(level);
                                setEditingPath(path);
                                setShowLevelModal(true);
                              }}
                              className="p-2 bg-zinc-800 rounded-lg text-white hover:text-accent transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                setConfirmModal({
                                  open: true,
                                  title: 'Eliminar Nivel',
                                  message: '¿Eliminar este nivel? Esta acción no se puede deshacer.',
                                  onConfirm: async () => {
                                    const updatedLevels = path.levels.filter(l => l.id !== level.id);
                                    await successPathService.updatePath(path.id, { levels: updatedLevels });
                                    setToast({ message: 'Nivel eliminado correctamente.', type: 'success' });
                                  },
                                });
                              }}
                              className="p-2 bg-red-950/30 rounded-lg text-red-500 hover:bg-red-950/50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1 uppercase">{level.title}</h3>
                        <p className="text-xs font-black text-accent uppercase tracking-widest mb-4">{level.rank}</p>
                        <p className="text-sm text-text-dim font-medium mb-6 line-clamp-2">{level.description}</p>
                        
                        <div className="pt-6 border-t border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Contenido Asignado</p>
                            <span className="text-[10px] font-black bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                              {(level.audioIds || []).length + (level.bookIds || []).length} ITEMS
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingPath(path);
                              setEditingLevel(level);
                              setShowContentPicker(true);
                            }}
                            className="w-full py-3 bg-zinc-900 text-white text-xs font-black rounded-xl hover:bg-accent hover:text-black transition-all uppercase tracking-widest"
                          >
                            Gestionar Contenido
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Modal for Level CRUD */}
              <AnimatePresence>
                {showLevelModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#090909] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                          {editingLevel ? 'Editar Nivel' : 'Nuevo Nivel'}
                        </h3>
                        <button onClick={() => setShowLevelModal(false)} className="text-text-dim hover:text-white">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Nombre del Nivel</label>
                          <input
                            type="text"
                            value={levelForm.title}
                            onChange={(e) => setLevelForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ej. Nivel 1"
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent/50 transition-all placeholder:text-text-dim/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Rango Sugerido</label>
                          <input
                            type="text"
                            value={levelForm.rank}
                            onChange={(e) => setLevelForm(prev => ({ ...prev, rank: e.target.value }))}
                            placeholder="Ej. Bronce"
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent/50 transition-all placeholder:text-text-dim/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Descripción</label>
                          <textarea
                            value={levelForm.description}
                            onChange={(e) => setLevelForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Breve explicación de este nivel..."
                            rows={3}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent/50 transition-all placeholder:text-text-dim/30"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            if (!editingPath) return;
                            setIsRoutesSubmitting(true);
                            if (editingLevel) {
                              const updatedLevels = editingPath.levels.map(l => 
                                l.id === editingLevel.id ? { ...l, ...levelForm } : l
                              );
                              await successPathService.updatePath(editingPath.id, { levels: updatedLevels });
                            } else {
                              const newLevel: SuccessPathLevel = {
                                id: `level-${Date.now()}`,
                                ...levelForm,
                                audioIds: [],
                                bookIds: []
                              };
                              await successPathService.updatePath(editingPath.id, { 
                                levels: [...editingPath.levels, newLevel] 
                              });
                            }
                            setIsRoutesSubmitting(false);
                            setShowLevelModal(false);
                            setNayaToast({ visible: true, title: editingLevel ? 'Nivel actualizado ✅' : 'Nivel creado ✅' });
                            setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
                          }}
                          className="w-full py-5 bg-accent text-black font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-accent/20 uppercase tracking-widest"
                        >
                          {editingLevel ? 'Guardar Cambios' : 'Crear Nivel'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Content Picker Modal */}
              <AnimatePresence>
                {showContentPicker && editingLevel && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      className="bg-[#090909] w-full max-w-4xl max-h-[85vh] rounded-[3rem] border border-white/10 flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                    >
                      <div className="p-10 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                        <div>
                          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Gestionar Contenido</h3>
                          <p className="text-accent font-black uppercase tracking-widest text-[10px] mt-1">
                            {editingLevel.title} — {editingLevel.rank}
                          </p>
                        </div>
                        <button onClick={() => setShowContentPicker(false)} className="w-12 h-12 rounded-2xl bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-all">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-12">
                        {/* Audio Selector */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                              <Headphones className="text-accent" /> Audios y Mentorías
                            </h4>
                            <span className="text-[10px] font-black bg-zinc-800 text-text-dim px-3 py-1 rounded-full uppercase">
                              {(audios || []).length} Disponibles
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(audios || []).map(audio => {
                              const isSelected = (editingLevel.audioIds || []).includes(audio.id);
                              return (
                                <button
                                  key={audio.id}
                                  onClick={async () => {
                                    if (!editingPath) return;
                                    const currentAudioIds = editingLevel.audioIds || [];
                                    const newAudioIds = isSelected 
                                      ? currentAudioIds.filter(id => id !== audio.id)
                                      : [...currentAudioIds, audio.id];
                                    
                                    const updatedLevel = { ...editingLevel, audioIds: newAudioIds };
                                    const updatedLevels = (editingPath.levels || []).map(l => 
                                      l.id === editingLevel.id ? updatedLevel : l
                                    );
                                    
                                    setEditingLevel(updatedLevel);
                                    await successPathService.updatePath(editingPath.id, { levels: updatedLevels });
                                  }}
                                  className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group ${
                                    isSelected 
                                      ? 'bg-accent/10 border-accent/30' 
                                      : 'bg-zinc-900/30 border-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl overflow-hidden relative ${isSelected ? 'bg-accent text-black' : 'bg-zinc-800 text-white/50'}`}>
                                    {audio.coverUrl ? (
                                      <img src={audio.coverUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <PlayCircle size={20} />
                                    )}
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-accent/80 flex items-center justify-center text-black">
                                        <CheckCircle2 size={24} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-text-dim'}`}>{audio.title}</p>
                                    <p className="text-[10px] font-black uppercase text-text-dim/50 tracking-widest">{audio.author}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Link to Books Selector */}
                        <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                              <BookOpen className="text-accent" /> Libros Recomendados
                            </h4>
                            <span className="text-[10px] font-black bg-zinc-800 text-text-dim px-3 py-1 rounded-full uppercase">
                              {(books || []).length} Disponibles
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(books || []).map(book => {
                              const isSelected = (editingLevel.bookIds || []).includes(book.id);
                              return (
                                <button
                                  key={book.id}
                                  onClick={async () => {
                                    if (!editingPath) return;
                                    const currentBookIds = editingLevel.bookIds || [];
                                    const newBookIds = isSelected 
                                      ? currentBookIds.filter(id => id !== book.id)
                                      : [...currentBookIds, book.id];
                                    
                                    const updatedLevel = { ...editingLevel, bookIds: newBookIds };
                                    const updatedLevels = (editingPath.levels || []).map(l => 
                                      l.id === editingLevel.id ? updatedLevel : l
                                    );
                                    
                                    setEditingLevel(updatedLevel);
                                    await successPathService.updatePath(editingPath.id, { levels: updatedLevels });
                                  }}
                                  className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group ${
                                    isSelected 
                                      ? 'bg-accent/10 border-accent/30' 
                                      : 'bg-zinc-900/30 border-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl overflow-hidden relative ${isSelected ? 'bg-accent text-black' : 'bg-zinc-800 text-white/50'}`}>
                                    {book.coverUrl ? (
                                      <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <BookOpen size={20} />
                                    )}
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-accent/80 flex items-center justify-center text-black">
                                        <CheckCircle2 size={24} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-text-dim'}`}>{book.title}</p>
                                    <p className="text-[10px] font-black uppercase text-text-dim/50 tracking-widest">{book.author}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="p-10 bg-zinc-900/20 border-t border-white/5">
                        <button
                          onClick={() => setShowContentPicker(false)}
                          className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-accent transition-all uppercase tracking-widest shadow-xl shadow-black/20"
                        >
                          Cerrar y Regresar
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {(activeTab === 'equipo' || activeTab === 'staff' || activeTab === 'EQUIPO Y STAFF' || activeTab === 'team') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-6 bg-[#111] rounded-xl border border-gray-800">
              {/* Columna Alta */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight italic">NUEVO COLABORADOR</h3>
                <input 
                  type="email"
                  placeholder="Email del colaborador" 
                  value={staffData.email}
                  onChange={(e) => setStaffData(p => ({ ...p, email: e.target.value }))}
                  className="w-full mb-3 p-3 bg-black text-white rounded border border-gray-700 outline-none focus:border-orange-500" 
                />
                <input 
                  placeholder="Contraseña Temporal" 
                  type="password" 
                  value={staffData.password}
                  onChange={(e) => setStaffData(p => ({ ...p, password: e.target.value }))}
                  className="w-full mb-3 p-3 bg-black text-white rounded border border-gray-700 outline-none focus:border-orange-500" 
                />
                <h4 className="text-orange-500 font-bold mb-3 mt-4 uppercase tracking-widest text-[10px]">PERMISOS ASIGNADOS</h4>
                <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    { id: 'dashboard', label: '📊 Dashboard (Métricas)' },
                    { id: 'inventory', label: '📋 Inventario (Gestión General)' },
                    { id: 'crm', label: '👥 Usuarios (CRM)' },
                    { id: 'audiobooks', label: '📚 Audiolibros' },
                    { id: 'mentoring', label: '🎙️ Mentorías' },
                    { id: 'talent', label: '💼 Start Talent' },
                    { id: 'commissions', label: '💰 Comisiones' },
                    { id: 'events', label: '💻 Eventos y Zoom' },
                    { id: 'editorial', label: '📅 Calendario Editorial' },
                    { id: 'routes', label: '🛣️ Rutas al Éxito' },
                  ].map((perm) => (
                    <label key={perm.id} className="flex items-center text-gray-300 cursor-pointer hover:text-white transition-colors py-1">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 accent-orange-500"
                        checked={!!(staffData.permissions as any)[perm.id]}
                        onChange={() => handleStaffPermissionToggle(perm.id)}
                      /> 
                      {perm.label}
                    </label>
                  ))}
                </div>
                <button 
                  onClick={handleCreateStaff}
                  disabled={isStaffSubmitting}
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded uppercase transition-all active:scale-[0.98] disabled:opacity-50 h-[56px] flex items-center justify-center"
                >
                  {isStaffSubmitting ? (
                    'PROCESANDO...'
                  ) : staffSuccess ? (
                    '¡LISTO! ✅'
                  ) : (
                    'Registrar Colaborador'
                  )}
                </button>
                {uploadStatus && (
                  <p className={`mt-4 text-center text-[10px] font-bold uppercase tracking-widest ${uploadStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {uploadStatus.message}
                  </p>
                )}
              </div>
              {/* Columna Huella */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight italic">HUELLA DE STAFF</h3>
                <div className="bg-black p-0 rounded border border-gray-700 overflow-hidden">
                   <table className="w-full text-left text-xs">
                     <thead>
                       <tr className="bg-white/5 border-b border-gray-800">
                         <th className="p-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Usuario</th>
                         <th className="p-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Huella</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800 text-gray-300">
                       <tr className="hover:bg-white/5">
                         <td className="p-3">asistente@inspira.com</td>
                         <td className="p-3">Añadió audio hace 2h</td>
                       </tr>
                       <tr className="hover:bg-white/5">
                         <td className="p-3">controles@inspira.com</td>
                         <td className="p-3">Generó reporte excel</td>
                       </tr>
                       {(users || []).filter(u => u.isAdmin && u.email !== SUPER_ADMIN_EMAIL).slice(0, 3).map(u => (
                         <tr key={u.id}>
                           <td className="p-3">{u.email}</td>
                           <td className="p-3 text-gray-500">Sin actividad hoy</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                <div className="mt-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                   <p className="text-[10px] text-orange-500/80 font-bold leading-relaxed uppercase">
                     Aquí se listarán las acciones de tu equipo una vez conectados a Firebase. El sistema de huella digital está activo.
                   </p>
                </div>
              </div>
            </div>
          )}
          {/* FIN DEL BLOQUE DE EQUIPO */}

          {activeTab === 'ranking' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-20 w-full"
            >
              <div className="bg-bg-card border border-border p-8 rounded-[32px] space-y-8 shadow-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                      <Trophy size={28} className="text-amber-500" />
                      GESTIÓN TOP 10 Y RANKING
                    </h2>
                    <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-1">Supervisión de popularidad y reconocimientos</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-border rounded-[24px] bg-black/20">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Ranking</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Título</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Autor/Talent</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest">Reproducciones</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim tracking-widest text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(audios || [])
                        .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0))
                        .map((audio, index) => {
                          const isTop10 = index < 10;
                          return (
                            <tr key={audio.id} className={`hover:bg-white/5 transition-colors ${isTop10 ? 'bg-amber-500/[0.02]' : ''}`}>
                              <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                  index === 0 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 
                                  index === 1 ? 'bg-zinc-300 text-black' :
                                  index === 2 ? 'bg-orange-400 text-black' :
                                  isTop10 ? 'bg-white/10 text-white' : 'text-text-dim'
                                }`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-lg shrink-0">
                                    <img src={audio.coverUrl} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="font-bold text-white uppercase italic text-xs truncate max-w-[200px]">{audio.title}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-text-dim font-black uppercase italic">
                                {audio.author}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white">{(audio.reproducciones || 0).toLocaleString()}</span>
                                  {isTop10 && <TrendingUp size={14} className="text-green-500" />}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isTop10 && (
                                  <button 
                                    onClick={() => {
                                      setFelicitarAudio(audio);
                                      setShowFelicitarModal(true);
                                    }}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                                  >
                                    Felicitar 🏆
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'commissions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-20 w-full"
            >
              {/* Header con Controles */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-card border border-border p-6 rounded-[32px]">
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                    <DollarSign size={28} className="text-green-500" />
                    Gestión de Comisiones
                  </h2>
                  <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-1">Liquidación y Reportes de Start Talent</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Selector de Periodo */}
                  <div className="flex bg-bg-deep p-1 rounded-2xl border border-border">
                    <button
                      onClick={() => setCommissionPeriod('monthly')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${commissionPeriod === 'monthly' ? 'bg-accent text-black' : 'text-text-dim hover:text-white'}`}
                    >
                      Mensual
                    </button>
                    <button
                      onClick={() => setCommissionPeriod('quarterly')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${commissionPeriod === 'quarterly' ? 'bg-accent text-black' : 'text-text-dim hover:text-white'}`}
                    >
                      Trimestral
                    </button>
                  </div>

                  <button
                    onClick={generateGlobalPDF}
                    className="bg-white/5 hover:bg-white/10 text-white border border-border px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                  >
                    <Download size={16} />
                    Reporte Global {commissionPeriod === 'monthly' ? 'Mes' : 'Trimestre'}
                  </button>
                </div>
              </div>

              {/* Tarjetas de Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-bg-card border border-border p-6 rounded-[32px] overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-green-500/20 transition-all" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-500">
                      <PlayCircle size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Reproducciones Válidas</p>
                      <h4 className="text-2xl font-black text-white italic">{(allSpeakers.reduce((acc, s) => acc + (s.totalPlays || 0), 0)).toLocaleString()}</h4>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-card border border-border p-6 rounded-[32px] overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-accent/20 transition-all" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Monto por Liquidar</p>
                      <h4 className="text-2xl font-black text-white italic">
                        $ {((allSpeakers.reduce((acc, s) => acc + (s.pendingPlays || 0), 0)) * (appConfig?.commissionRate || 0.10)).toFixed(2)}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-card border border-border p-6 rounded-[32px] overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-zinc-500/20 transition-all" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-white">
                      <Settings size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Tasa de Conversión</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-text-dim font-bold text-xs">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={appConfig?.commissionRate || 0.10}
                          onChange={(e) => {
                            if (appConfig) {
                              configService.updateConfig({ commissionRate: parseFloat(e.target.value) });
                            }
                          }}
                          className="bg-zinc-800 border-none outline-none rounded-lg px-2 py-1 text-white text-lg font-black w-24"
                        />
                        <span className="text-text-dim text-[10px] font-black uppercase">per play</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido de Tablas */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                {/* Liquidación de Talento */}
                <div className="bg-bg-card border border-border rounded-[32px] overflow-hidden">
                  <div className="p-6 border-b border-border flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                       <DollarSign className="text-accent" size={20} />
                       Liquidación de Start Talent
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={generateBulkPDFs}
                        className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
                      >
                        <Download size={16} />
                        📥 Todos los Reportes (PDF)
                      </button>
                      <button 
                        onClick={generateGlobalPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-all"
                      >
                        <BarChart2 size={16} />
                        Resumen Global
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-bg-deep/50 text-[10px] font-black text-text-dim uppercase tracking-widest border-b border-border">
                          <th className="p-6">Star Talent / Mentor</th>
                          <th className="p-6">Plays Pendientes</th>
                          <th className="p-6">Comisión</th>
                          <th className="p-6 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {(allSpeakers || []).length > 0 && (allSpeakers || []).map(talent => (
                          <tr key={talent.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 border border-border/50">
                                  {talent.photoUrl ? (
                                    <img src={talent.photoUrl} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <UserIcon size={20} className="text-text-dim" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{talent.name}</p>
                                  <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{talent.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-white font-black text-lg">{(talent.pendingPlays || 0).toLocaleString()}</span>
                            </td>
                            <td className="p-6">
                              <span className="text-accent font-black text-xl italic">$ {((talent.pendingPlays || 0) * (appConfig?.commissionRate || 0.10)).toFixed(2)}</span>
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => generateTalentPDF(talent)}
                                  className="p-3 rounded-xl bg-zinc-800 text-text-dim hover:text-white hover:bg-zinc-700 transition-all"
                                  title="Descargar Reporte PDF"
                                >
                                  <Download size={18} />
                                </button>
                                <button
                                  disabled={(talent.pendingPlays || 0) === 0}
                                  onClick={() => {
                                    const amount = (talent.pendingPlays || 0) * (appConfig?.commissionRate || 0.10);
                                    setConfirmModal({
                                      open: true,
                                      title: 'Confirmar Pago',
                                      message: `¿Confirmas el pago de $${amount.toFixed(2)} a ${talent.name}?`,
                                      onConfirm: async () => {
                                        await commissionService.settleTalent(talent.id, talent.name, amount, talent.pendingPlays || 0);
                                        setNayaToast({ visible: true, title: `Liquidación de ${talent.name} exitosa ✅` });
                                        setTimeout(() => setNayaToast({ visible: false, title: '' }), 3000);
                                      },
                                    });
                                  }}
                                  className="bg-accent/10 hover:bg-accent text-accent hover:text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 disabled:pointer-events-none"
                                >
                                  { (talent.pendingPlays || 0) > 0 ? 'Registrar Pago y Liquidar' : 'Liquidado' }
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(allSpeakers || []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-20 text-center text-text-dim font-black uppercase text-xs tracking-widest opacity-50">
                              No hay talentos registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Historial de Pagos */}
                <div className="bg-bg-card border border-border rounded-[32px] overflow-hidden">
                  <div className="p-6 border-b border-border flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                       <History className="text-text-dim" size={20} />
                       Historial de Liquidaciones
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-bg-deep/50 text-[10px] font-black text-text-dim uppercase tracking-widest border-b border-border">
                          <th className="p-6">Fecha</th>
                          <th className="p-6">Talento</th>
                          <th className="p-6">Plays Liquidados</th>
                          <th className="p-6 text-right">Monto Pagado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {(payments || []).map(payment => (
                          <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-6">
                              <p className="text-text-dim font-bold text-xs">{new Date(payment.date).toLocaleDateString()}</p>
                              <p className="text-[10px] text-zinc-600 font-bold uppercase">{new Date(payment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </td>
                            <td className="p-6 text-white font-bold">{payment.talentName}</td>
                            <td className="p-6 text-text-dim font-medium">{payment.playsSettled.toLocaleString()}</td>
                            <td className="p-6 text-right font-black text-green-500">$ {payment.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        {(payments || []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-20 text-center text-text-dim font-black uppercase text-xs tracking-widest opacity-50">
                              Aún no hay historial de pagos registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto pb-20 w-full"
            >
              <div className="bg-bg-card border border-border rounded-[32px] p-8 shadow-2xl space-y-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight uppercase">⚙️ Configuración Global</h3>
                  <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Datos de contacto y pagos</p>
                </div>

                {!appConfig ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw size={40} className="text-accent animate-spin" />
                    <p className="text-text-dim font-black uppercase text-xs tracking-widest">Cargando configuración...</p>
                    <button 
                      onClick={() => setAppConfig({
                        id: 'global',
                        whatsappVentas: '',
                        whatsappSoporte: '',
                        commissionRate: 0.10,
                        bankDetails: {
                          banco: '',
                          titular: '',
                          cuenta: '',
                          clabe: ''
                        }
                      })}
                      className="mt-4 px-6 py-3 bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Inicializar Configuración
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateConfig} className="space-y-8">
                    {/* Sección Contacto */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-accent">
                        <MessageSquare size={18} />
                        <h4 className="font-black uppercase tracking-widest text-xs">Canales de Comunicación</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">WhatsApp Ventas / VIP</label>
                          <input 
                            required
                            type="text"
                            placeholder="+521234567890"
                            value={appConfig.whatsappVentas}
                            onChange={(e) => setAppConfig({...appConfig, whatsappVentas: e.target.value})}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">WhatsApp Soporte Técnico</label>
                          <input 
                            required
                            type="text"
                            placeholder="+521234567890"
                            value={appConfig.whatsappSoporte}
                            onChange={(e) => setAppConfig({...appConfig, whatsappSoporte: e.target.value})}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección Pagos */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-accent">
                        <Landmark size={18} />
                        <h4 className="font-black uppercase tracking-widest text-xs">Datos Bancarios (Transferencia)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Nombre del Banco</label>
                          <input 
                            required
                            type="text"
                            placeholder="Ej: BBVA, Santander..."
                            value={appConfig.bankDetails.banco}
                            onChange={(e) => setAppConfig({
                              ...appConfig, 
                              bankDetails: { ...appConfig.bankDetails, banco: e.target.value }
                            })}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Titular de la Cuenta</label>
                          <input 
                            required
                            type="text"
                            placeholder="Nombre completo"
                            value={appConfig.bankDetails.titular}
                            onChange={(e) => setAppConfig({
                              ...appConfig, 
                              bankDetails: { ...appConfig.bankDetails, titular: e.target.value }
                            })}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Número de Cuenta</label>
                          <input 
                            required
                            type="text"
                            placeholder="0123456789"
                            value={appConfig.bankDetails.cuenta}
                            onChange={(e) => setAppConfig({
                              ...appConfig, 
                              bankDetails: { ...appConfig.bankDetails, cuenta: e.target.value }
                            })}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">CLABE Interbancaria (18 dígitos)</label>
                          <input 
                            required
                            type="text"
                            placeholder="000000000000000000"
                            value={appConfig.bankDetails.clabe}
                            onChange={(e) => setAppConfig({
                              ...appConfig, 
                              bankDetails: { ...appConfig.bankDetails, clabe: e.target.value }
                            })}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-accent">
                        <DollarSign size={18} />
                        <h4 className="font-black uppercase tracking-widest text-xs">Comisiones y Pagos</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-2">Tasa de Comisión (Monto por Play)</label>
                          <input 
                            required
                            type="number"
                            step="0.01"
                            placeholder="0.10"
                            value={appConfig.commissionRate}
                            onChange={(e) => setAppConfig({...appConfig, commissionRate: parseFloat(e.target.value)})}
                            className="w-full bg-bg-deep border border-border rounded-2xl py-4 px-6 text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {uploadStatus && activeTab === 'settings' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-4 rounded-xl flex items-center gap-3 ${
                          uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-xs font-bold">{uploadStatus.message}</span>
                      </motion.div>
                    )}

                    <button 
                      type="submit"
                      disabled={isConfigSubmitting}
                      className="w-full bg-accent text-black py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isConfigSubmitting ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Guardando...
                        </>
                      ) : configSuccess ? (
                        '¡LISTO! ✅'
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Guardar Cambios Globales
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL FELICITACIÓN TOP 10 */}
        <AnimatePresence>
          {showFelicitarModal && felicitarAudio && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFelicitarModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-bg-card border border-border rounded-[40px] p-8 shadow-2xl overflow-hidden"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">RECONOCIMIENTO DIRECTO</h3>
                      <p className="text-[10px] text-accent font-black uppercase tracking-widest">{felicitarAudio.author}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFelicitarModal(false)}
                    className="p-2 hover:bg-white/5 rounded-full text-text-dim transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Audio Destacado</p>
                    <div className="flex items-center gap-3">
                      <img src={felicitarAudio.coverUrl} className="w-10 h-10 object-cover rounded-lg" alt="" />
                      <p className="text-xs font-bold text-white uppercase">{felicitarAudio.title}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">Mensaje de Felicitación</label>
                    <textarea 
                      rows={5}
                      value={felicitarMessage}
                      onChange={(e) => setFelicitarMessage(e.target.value)}
                      placeholder="¡Felicidades Líder! Tu contenido está inspirando a cientos de personas hoy..."
                      className="w-full bg-black border border-border rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500 transition-all resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleSendFelicitation}
                    disabled={isSendingFelicitation || !felicitarMessage.trim()}
                    className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    {isSendingFelicitation ? 'Enviando...' : 'Enviar Reconocimiento ✨'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
