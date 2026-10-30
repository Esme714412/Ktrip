import React, { useState, useEffect, useMemo, useRef } from 'react';
import { loadAppData, saveAppData } from './src/storage';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Compass, 
  BookOpen, 
  CheckSquare,
  CreditCard, 
  Sliders, 
  MapPin, 
  Bookmark, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  DollarSign, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Receipt, 
  Layers, 
  FileSpreadsheet, 
  FileText, 
  Database,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ListPlus,
  FileCode,
  HelpCircle,
  Check,
  Pencil,
  Search,
  GripVertical,
  ImagePlus,
  Smile
} from 'lucide-react';

function SortableItineraryCard({ id, children, editMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !editMode });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined
      }}
      className={`flex items-center gap-1 ${isDragging ? 'relative z-10 opacity-80' : ''}`}
    >
      {editMode && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-neutral-400 hover:text-neutral-800 active:text-neutral-900 p-1 rounded-lg cursor-grab active:cursor-grabbing touch-none shrink-0"
          title="按住拖動調整順序"
          aria-label="按住拖動調整行程順序"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// --- 初始示範資料 ---
const INITIAL_RATES = {
  JPY: 0.215,
  KRW: 0.024,
  USD: 32.25,
  EUR: 34.80,
  TWD: 1.00
};

const CURRENCIES = [
  { code: 'TWD', name: '新台幣' },
  { code: 'JPY', name: '日圓' },
  { code: 'KRW', name: '韓元' },
  { code: 'USD', name: '美元' },
  { code: 'EUR', name: '歐元' }
];

const INITIAL_CATEGORIES = ['景點漫遊', '美食散策', '街頭隨拍', '戰利品開箱', '旅宿體驗', '交通日常'];

const INITIAL_POSTS = [
  {
    id: 'post-1',
    createdAt: '2026-10-24 16:45',
    location: '京都・清水寺 音羽之瀧',
    mood: '🍁 秋意正濃・涼爽微風',
    category: '景點漫遊',
    content: '午後漫步在產寧坂，秋風徐徐。趕在日落前登上了清水舞台，遠眺京都市區被夕陽染成金黃色，這趟關西旅程最平靜療癒的瞬間 ✨\n\n旁邊買了一串烤糰子，醬油甜鹹交錯的香氣實在太幸福了！',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80'
    ],
    isBookmarked: true
  },
  {
    id: 'post-2',
    createdAt: '2026-10-25 11:20',
    location: '首爾・弘大 延南洞巷弄',
    mood: '☕ 陽光灑落的午後咖啡',
    category: '美食散策',
    content: '避開了主街的喧囂，在延南洞巷弄裡找到這間以手作酥皮為特色的木質小店。手沖肯亞明亮乾淨，配上現烤焦糖奶油酥～旅行就要有這種放空整理手帳的節奏 ☕🇰🇷',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80'
    ],
    isBookmarked: false
  },
  {
    id: 'post-3',
    createdAt: '2026-10-25 19:30',
    location: '首爾・漢江公園 汝矣島',
    mood: '🌙 愜意秋夜',
    category: '街頭隨拍',
    content: '在超商煮了一碗熱騰騰的漢江泡麵，席地坐在草地上看著麻浦大橋的霓虹倒影。吹著微涼的漢江晚風，耳邊是街頭藝人的吉他聲，這就是自由的滋味。',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
    ],
    isBookmarked: true
  }
];

const INITIAL_ITINERARY = [
  { id: 'it-1', day: 'Day 1', time: '09:30', location: '清水寺 & 地主神社', note: '租借和服漫步二年坂、三年坂', completed: true },
  { id: 'it-2', day: 'Day 1', time: '13:00', location: '錦市場道地美食巡禮', note: '章魚燒、豆乳甜甜圈', completed: false },
  { id: 'it-3', day: 'Day 1', time: '16:30', location: '伏見稻荷大社', note: '千本鳥居夕陽攝影', completed: false },
  { id: 'it-4', day: 'Day 2', time: '10:00', location: '嵐山天龍寺與竹林小徑', note: '搭乘嵯峨野小火車', completed: false },
  { id: 'it-5', day: 'Day 2', time: '15:00', location: '金閣寺 (鹿苑寺)', note: '鏡湖池倒影拍照', completed: false }
];

const INITIAL_TRIP_START_DATE = '2026-10-24';
const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

const getItineraryDayNumber = (day) => {
  const latinMatch = day.match(/Day\s*(\d+)/i);
  if (latinMatch) return Number(latinMatch[1]);

  const chineseMatch = day.match(/第([一二三四五六七八九十\d]+)天/);
  if (!chineseMatch) return null;
  const value = chineseMatch[1];
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十') return 10;
  if (value.startsWith('十')) return 10 + (value.length > 1 ? '一二三四五六七八九'.indexOf(value[1]) + 1 : 0);
  if (value.includes('十')) {
    return ('一二三四五六七八九'.indexOf(value[0]) + 1) * 10
      + (value.length > 1 ? Math.max(0, '一二三四五六七八九'.indexOf(value[2]) + 1) : 0);
  }
  return '一二三四五六七八九'.indexOf(value) + 1;
};

const getItineraryDateLabel = (day, startDate) => {
  const dayNumber = getItineraryDayNumber(day);
  if (!dayNumber || !startDate) return '';
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + dayNumber - 1);
  return `${date.getMonth() + 1}/${date.getDate()} ${WEEKDAYS[date.getDay()]}`;
};

const INITIAL_SHOPPING = [
  { id: 'sh-1', item: '京都祇園辻利 抹茶蛋捲禮盒', store: '祇園商店街', estimatedPrice: '1,800 JPY', bought: true },
  { id: 'sh-2', item: 'Gentle Monster 墨鏡', store: '首爾弘大旗艦店', estimatedPrice: '280,000 KRW', bought: false },
  { id: 'sh-3', item: 'Tamburins 經典護手霜 000', store: '聖水洞專賣店', estimatedPrice: '32,000 KRW', bought: false }
];

const INITIAL_EXPENSES = [
  {
    id: 'exp-1',
    title: '清水寺參拜門票 (2人)',
    category: '門票景點',
    currency: 'JPY',
    amount: 1000,
    rate: 0.215,
    convertedAmount: 215,
    paymentMethod: '現金',
    date: '2026-10-24',
    note: '含音羽瀑布參拜手水舍'
  },
  {
    id: 'exp-2',
    title: '產寧坂 醬油糰子與宇治抹茶',
    category: '餐飲美食',
    currency: 'JPY',
    amount: 1400,
    rate: 0.215,
    convertedAmount: 301,
    paymentMethod: '交通卡/IC',
    date: '2026-10-24',
    note: '老舖八ツ橋邊小茶屋'
  },
  {
    id: 'exp-3',
    title: '弘大設計選品店文具與香氛',
    category: '購物開箱',
    currency: 'KRW',
    amount: 45000,
    rate: 0.024,
    convertedAmount: 1080,
    paymentMethod: '信用卡',
    date: '2026-10-25',
    note: '買了旅人手帳替芯與木質印章'
  },
  {
    id: 'exp-4',
    title: '延南洞手沖單品咖啡與可頌',
    category: '餐飲美食',
    currency: 'KRW',
    amount: 18500,
    rate: 0.024,
    convertedAmount: 444,
    paymentMethod: '信用卡',
    date: '2026-10-25',
    note: '單品手沖 2 杯 + 招牌點心'
  }
];

const EXPENSE_CATEGORIES = ['餐飲美食', '交通運輸', '購物開箱', '住宿旅店', '門票景點', '生活其他'];

const SAMPLE_MARKDOWN_ITINERARY = `# Day 1 - 京都古都探索
- 09:30 清水寺 | 和服體驗漫遊二年坂、三年坂
- [ ] 12:30 錦市場: 品嚐豆乳甜甜圈與章魚燒
- 15:30 伏見稻荷大社 (備忘：千本鳥居拍照)
- 18:30 鴨川納涼床 - 傳統京料理晚餐

## Day 2: 嵐山與金閣寺
- [x] 08:30 搭乘嵯峨野觀光鐵道小火車
- 11:00 嵐山竹林小徑與野宮神社 | 散策漫遊
- 14:30 金閣寺 (鹿苑寺) - 鏡湖池金箔倒影
- 17:30 四條河原町 藥妝與生活雜貨採購`;

export default function App() {
  // --- 狀態管理 ---
  // 'feed' | 'plans' | 'expenses' | 'settings'
  const [activeTab, setActiveTab] = useState('feed'); 
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const itinerarySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 今日日期顯示
  const todayString = useMemo(() => {
    const d = new Date();
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  }, []);

  const [rates, setRates] = useState(INITIAL_RATES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [itinerary, setItinerary] = useState(INITIAL_ITINERARY);
  const [shoppingList, setShoppingList] = useState(INITIAL_SHOPPING);
  const [expenses, setExpenses] = useState<(typeof INITIAL_EXPENSES[number] & { createdAt?: string })[]>(INITIAL_EXPENSES);
  const [tripStartDate, setTripStartDate] = useState(INITIAL_TRIP_START_DATE);
  const [displayCurrency, setDisplayCurrency] = useState('TWD');

  // 通知提示
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const persistData = (key, value) => {
    saveAppData(key, value).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`離線資料儲存失敗：${message}`, 'error');
    });
  };

  useEffect(() => {
    let isActive = true;

    loadAppData({
      rates: INITIAL_RATES,
      categories: INITIAL_CATEGORIES,
      posts: INITIAL_POSTS,
      itinerary: INITIAL_ITINERARY,
      shopping: INITIAL_SHOPPING,
      expenses: INITIAL_EXPENSES,
      tripStartDate: INITIAL_TRIP_START_DATE,
      displayCurrency: 'TWD'
    }).then(data => {
      if (!isActive) return;
      setRates(data.rates);
      setCategories(data.categories);
      setPosts(data.posts);
      setItinerary(data.itinerary);
      setShoppingList(data.shopping);
      setExpenses(data.expenses);
      setTripStartDate(data.tripStartDate);
      setDisplayCurrency(CURRENCIES.some(currency => currency.code === data.displayCurrency)
        ? data.displayCurrency
        : 'TWD');
      setIsDataReady(true);
    }).catch(error => {
      if (!isActive) return;
      const message = error instanceof Error ? error.message : String(error);
      setStorageError(message);
    });

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const handleInstallPrompt = event => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!isDataReady) return;
    persistData('rates', rates);
  }, [rates, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('categories', categories);
  }, [categories, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('posts', posts);
  }, [posts, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('itinerary', itinerary);
  }, [itinerary, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('shopping', shoppingList);
  }, [shoppingList, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('expenses', expenses);
  }, [expenses, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('tripStartDate', tripStartDate);
  }, [tripStartDate, isDataReady]);
  useEffect(() => {
    if (!isDataReady) return;
    persistData('displayCurrency', displayCurrency);
  }, [displayCurrency, isDataReady]);

  // --- 刪除確認 Modal 狀態 ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '確認刪除',
    onConfirm: null
  });
  const requestConfirmation = (title, message, onConfirm, confirmLabel = '確認刪除') => {
    setConfirmDialog({ isOpen: true, title, message, confirmLabel, onConfirm });
  };
  const closeConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      confirmLabel: '確認刪除',
      onConfirm: null
    });
  };
  const confirmAction = () => {
    const onConfirm = confirmDialog.onConfirm;
    closeConfirmation();
    onConfirm?.();
  };

  // --- 燈箱 (Lightbox) 狀態 ---
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0
  });

  // --- 底部滑出抽屜 (Bottom Sheet) 發文狀態 ---
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postMood, setPostMood] = useState('');
  const [postCategory, setPostCategory] = useState(() => categories[0] || '景點漫遊');
  const [selectedImages, setSelectedImages] = useState([]);
  const [postComposerFields, setPostComposerFields] = useState({
    location: false,
    category: false,
    mood: false
  });
  const [feedFilterTag, setFeedFilterTag] = useState('ALL');
  const [feedSearch, setFeedSearch] = useState('');

  const fileInputRef = useRef(null);

  // --- 行程與購物清單狀態 ---
  const [planSubTab, setPlanSubTab] = useState('itinerary'); // 'itinerary' | 'shopping'
  const [itineraryEditMode, setItineraryEditMode] = useState(false);
  const [isAddItineraryOpen, setIsAddItineraryOpen] = useState(false);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [newItDay, setNewItDay] = useState('Day 1');
  const [newItTime, setNewItTime] = useState('');
  const [newItLocation, setNewItLocation] = useState('');
  const [newItNote, setNewItNote] = useState('');

  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [editingShoppingId, setEditingShoppingId] = useState(null);
  const [newShopItem, setNewShopItem] = useState('');
  const [newShopStore, setNewShopStore] = useState('');
  const [newShopPrice, setNewShopPrice] = useState('');

  // --- Markdown 批量匯入行程狀態 ---
  const [isMdImportOpen, setIsMdImportOpen] = useState(false);
  const [mdInputText, setMdInputText] = useState('');
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'

  // --- 記帳狀態 ---
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expCurrency, setExpCurrency] = useState('JPY');
  const [expAmount, setExpAmount] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState('現金');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expNote, setExpNote] = useState('');
  const [expFilterCategory, setExpFilterCategory] = useState('ALL');

  // 設定頁暫存
  const [rateInputs, setRateInputs] = useState({
    JPY: String(rates.JPY),
    KRW: String(rates.KRW),
    USD: String(rates.USD),
    EUR: String(rates.EUR)
  });
  useEffect(() => {
    setRateInputs({
      JPY: String(rates.JPY),
      KRW: String(rates.KRW),
      USD: String(rates.USD),
      EUR: String(rates.EUR)
    });
  }, [rates]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const restoreFileRef = useRef(null);
  const formatCurrency = (amount, currency = displayCurrency) => {
    const fractionDigits = ['TWD', 'JPY', 'KRW'].includes(currency) ? 0 : 2;
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency,
      maximumFractionDigits: fractionDigits
    }).format(amount);
  };

  // ---------------- Handlers: 手帳 ----------------
  const handleOpenBottomSheet = () => {
    setEditingPostId(null);
    setPostContent('');
    setPostLocation('');
    setPostMood('');
    setPostCategory(categories[0] || '景點漫遊');
    setSelectedImages([]);
    setPostComposerFields({ location: false, category: false, mood: false });
    setIsBottomSheetOpen(true);
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!postContent.trim() && selectedImages.length === 0) {
      showToast('請記錄些旅行心得或加入相片！', 'error');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const postDetails = {
      location: postLocation.trim() || '旅行足跡某一隅',
      mood: postMood.trim(),
      category: postCategory || '旅途隨筆',
      content: postContent.trim(),
      images: selectedImages
    };

    if (editingPostId) {
      setPosts(posts.map(post => (
        post.id === editingPostId ? { ...post, ...postDetails } : post
      )));
      showToast('手帳紀錄已更新');
    } else {
      const newPost = {
        id: `post-${Date.now()}`,
        createdAt: formattedDate,
        ...postDetails,
        isBookmarked: false
      };
      setPosts([newPost, ...posts]);
      showToast('✨ 手帳已順利新增！');
    }

    setEditingPostId(null);
    setPostContent('');
    setPostLocation('');
    setPostMood('');
    setSelectedImages([]);
    setPostComposerFields({ location: false, category: false, mood: false });
    setIsBottomSheetOpen(false);
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setPostContent(post.content || '');
    setPostLocation(post.location || '');
    setPostMood(post.mood || '');
    setPostCategory(post.category || categories[0] || '景點漫遊');
    setSelectedImages(post.images || []);
    setPostComposerFields({
      location: Boolean(post.location),
      category: Boolean(post.category),
      mood: Boolean(post.mood)
    });
    setIsBottomSheetOpen(true);
  };

  const requestDeletePost = (post) => {
    requestConfirmation(
      '確認刪除這篇手帳？',
      `「${post.location || '此篇手帳'}」將被永久移除且無法復原。`,
      () => {
        setPosts(posts.filter(p => p.id !== post.id));
        showToast('已安全刪除手帳紀錄');
      }
    );
  };

  const handleToggleBookmark = (id) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        const next = !p.isBookmarked;
        showToast(next ? '已加入旅人珍藏 📌' : '已從珍藏中移除');
        return { ...p, isBookmarked: next };
      }
      return p;
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImages(prev => [...prev, uploadEvent.target.result]);
          showToast('相片已成功加入');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 燈箱控制
  const openLightbox = (images, index) => {
    setLightbox({ isOpen: true, images, currentIndex: index });
  };
  const closeLightbox = () => {
    setLightbox({ isOpen: false, images: [], currentIndex: 0 });
  };
  const prevLightboxImage = () => {
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };
  const nextLightboxImage = () => {
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  // ---------------- Handlers: 行程與 Markdown 批量匯入 ----------------
  const handleToggleItinerary = (id) => {
    setItinerary(itinerary.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteItinerary = (id) => {
    const item = itinerary.find(entry => entry.id === id);
    if (!item) return;
    requestConfirmation(
      '確認刪除行程？',
      `「${item.location}」將被永久移除且無法復原。`,
      () => {
        setItinerary(itinerary.filter(entry => entry.id !== id));
        showToast('已刪除此行程');
      }
    );
  };

  const handleReorderItinerary = (activeId, overId) => {
    if (!overId || activeId === overId || !itineraryEditMode) return;

    const activeIndex = itinerary.findIndex(item => item.id === activeId);
    const overIndex = itinerary.findIndex(item => item.id === overId);
    if (activeIndex === -1 || overIndex === -1) return;

    const reordered = [...itinerary];
    const [movedItem] = reordered.splice(activeIndex, 1);
    const targetIndex = reordered.findIndex(item => item.id === overId);
    const targetItem = reordered[targetIndex];
    reordered.splice(targetIndex, 0, {
      ...movedItem,
      day: targetItem.day || 'Day 1'
    });
    setItinerary(reordered);
  };

  const handleOpenNewItinerary = () => {
    setEditingItineraryId(null);
    setNewItDay('Day 1');
    setNewItTime('');
    setNewItLocation('');
    setNewItNote('');
    setIsAddItineraryOpen(true);
  };

  const handleEditItinerary = (item) => {
    setEditingItineraryId(item.id);
    setNewItDay(item.day || 'Day 1');
    setNewItTime(item.time === '--:--' ? '' : item.time || '');
    setNewItLocation(item.location || '');
    setNewItNote(item.note || '');
    setIsAddItineraryOpen(true);
  };

  const handleAddSingleItinerary = (e) => {
    e.preventDefault();
    if (!newItLocation.trim()) {
      showToast('請填寫地點或活動名稱！', 'error');
      return;
    }
    const itemDetails = {
      day: newItDay.trim() || 'Day 1',
      time: newItTime.trim() || '--:--',
      location: newItLocation.trim(),
      note: newItNote.trim()
    };
    if (editingItineraryId) {
      setItinerary(itinerary.map(item => (
        item.id === editingItineraryId ? { ...item, ...itemDetails } : item
      )));
      showToast('行程已更新');
    } else {
      setItinerary([...itinerary, {
        id: `it-${Date.now()}`,
        ...itemDetails,
        completed: false
      }]);
      showToast('行程已新增');
    }
    setEditingItineraryId(null);
    setNewItLocation('');
    setNewItTime('');
    setNewItNote('');
    setIsAddItineraryOpen(false);
  };

  // Markdown 解析引擎
  const parsedMarkdownItems = useMemo(() => {
    if (!mdInputText.trim()) return [];
    const lines = mdInputText.split('\n');
    let currentDay = 'Day 1';
    const items = [];

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return;

      // 檢查是否為天數標題: # Day 1, ## Day 2: 嵐山, ### Day 3, **Day 1**
      const dayMatch = line.match(/^(?:#+|\*\*)\s*(Day\s*\d+|第[一二三四五六七八九十\d]+天)(?:[:：\s\-_–—]+(.*?))?(?:\*\*)?$/i);
      if (dayMatch) {
        currentDay = dayMatch[1].trim();
        return;
      }

      // 檢查是否為清單項目: - 09:30 清水寺 | 和服體驗, - [ ] 12:00 錦市場, * 14:00 景點
      const listItemMatch = line.match(/^[-*+]\s+(?:\[([ xX])\]\s+)?(.*)$/);
      if (listItemMatch) {
        const isChecked = !!(listItemMatch[1] && listItemMatch[1].toLowerCase() === 'x');
        let content = listItemMatch[2].trim();

        // 提取開頭的時間 (如 09:30, 9:30, 14:00)
        let time = '--:--';
        const timeMatch = content.match(/^(\d{1,2}:\d{2})\s*(?:[:：\s\-_–—|]\s*)?(.*)$/);
        if (timeMatch) {
          time = timeMatch[1];
          content = timeMatch[2].trim();
        }

        // 拆解地點與備忘 (支援 | 或 - 或 : 或 (備忘：...))
        let location = content;
        let note = '';

        if (content.includes('|')) {
          const parts = content.split('|');
          location = parts[0].trim();
          note = parts.slice(1).join('|').trim();
        } else if (content.includes(' (備忘：') || content.includes(' (備註：')) {
          const parts = content.split(/\s*\((?:備忘|備註)[：:]/);
          location = parts[0].trim();
          note = parts[1] ? parts[1].replace(/\)$/, '').trim() : '';
        } else if (content.includes(' - ')) {
          const parts = content.split(' - ');
          location = parts[0].trim();
          note = parts.slice(1).join(' - ').trim();
        }

        if (location) {
          items.push({
            id: `md-item-${index}-${Date.now()}`,
            day: currentDay,
            time,
            location,
            note,
            completed: isChecked
          });
        }
      }
    });

    return items;
  }, [mdInputText]);

  const handleConfirmMarkdownImport = () => {
    if (parsedMarkdownItems.length === 0) {
      showToast('未偵測到有效的 Markdown 行程，請檢查格式！', 'error');
      return;
    }

    if (importMode === 'replace') {
      requestConfirmation(
        '確認替換全部行程？',
        '目前的行程會被匯入內容取代，此操作無法復原。',
        () => {
          setItinerary(parsedMarkdownItems);
          showToast(`已替換全部行程，共匯入 ${parsedMarkdownItems.length} 項行程！`);
          setIsMdImportOpen(false);
          setMdInputText('');
        },
        '確認替換'
      );
    } else {
      setItinerary([...itinerary, ...parsedMarkdownItems]);
      showToast(`已追加匯入 ${parsedMarkdownItems.length} 項行程！`);
      setIsMdImportOpen(false);
      setMdInputText('');
    }
  };

  // 購物清單操作
  const handleToggleShopping = (id) => {
    setShoppingList(shoppingList.map(item => item.id === id ? { ...item, bought: !item.bought } : item));
  };
  const handleDeleteShopping = (id) => {
    const item = shoppingList.find(entry => entry.id === id);
    if (!item) return;
    requestConfirmation(
      '確認刪除購物項目？',
      `「${item.item}」將被永久移除且無法復原。`,
      () => {
        setShoppingList(shoppingList.filter(entry => entry.id !== id));
        showToast('已移除購物項目');
      }
    );
  };
  const handleOpenNewShopping = () => {
    setEditingShoppingId(null);
    setNewShopItem('');
    setNewShopStore('');
    setNewShopPrice('');
    setIsAddShoppingOpen(true);
  };
  const handleEditShopping = (item) => {
    setEditingShoppingId(item.id);
    setNewShopItem(item.item || '');
    setNewShopStore(item.store === '未指定店家' ? '' : item.store || '');
    setNewShopPrice(item.estimatedPrice === '依現場為主' ? '' : item.estimatedPrice || '');
    setIsAddShoppingOpen(true);
  };
  const handleAddShopping = (e) => {
    e.preventDefault();
    if (!newShopItem.trim()) return;
    const itemDetails = {
      item: newShopItem.trim(),
      store: newShopStore.trim() || '未指定店家',
      estimatedPrice: newShopPrice.trim() || '依現場為主'
    };
    if (editingShoppingId) {
      setShoppingList(shoppingList.map(item => (
        item.id === editingShoppingId ? { ...item, ...itemDetails } : item
      )));
      showToast('購物項目已更新');
    } else {
      setShoppingList([...shoppingList, {
        id: `sh-${Date.now()}`,
        ...itemDetails,
        bought: false
      }]);
      showToast('心願商品已加入');
    }
    setEditingShoppingId(null);
    setNewShopItem('');
    setNewShopStore('');
    setNewShopPrice('');
    setIsAddShoppingOpen(false);
  };

  // ---------------- Handlers: 記帳 ----------------
  const currentRate = rates[expCurrency] || 1;
  const displayRate = rates[displayCurrency] || 1;
  const convertToDisplayCurrency = (amount, currency) => (
    amount * (rates[currency] || 1) / displayRate
  );
  const estimatedDisplayAmount = expAmount
    ? convertToDisplayCurrency(parseFloat(expAmount) || 0, expCurrency)
    : 0;

  const handleOpenNewExpense = () => {
    setEditingExpenseId(null);
    setExpTitle('');
    setExpCategory(EXPENSE_CATEGORIES[0]);
    setExpCurrency('KRW');
    setExpAmount('');
    setExpPaymentMethod('現金');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpNote('');
    setIsAddExpenseOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setExpTitle(expense.title || '');
    setExpCategory(expense.category || EXPENSE_CATEGORIES[0]);
    setExpCurrency(expense.currency || 'TWD');
    setExpAmount(String(expense.amount ?? ''));
    setExpPaymentMethod(expense.paymentMethod || '現金');
    setExpDate(expense.date || new Date().toISOString().slice(0, 10));
    setExpNote(expense.note || '');
    setIsAddExpenseOpen(true);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('請填寫正確項目與金額！', 'error');
      return;
    }

    const appliedRate = rates[expCurrency] || 1;
    const expenseDetails = {
      title: expTitle.trim(),
      category: expCategory,
      currency: expCurrency,
      amount: parsedAmount,
      rate: appliedRate,
      convertedAmount: Math.round(parsedAmount * appliedRate),
      paymentMethod: expPaymentMethod,
      date: expDate || new Date().toISOString().slice(0, 10),
      note: expNote.trim()
    };

    if (editingExpenseId) {
      setExpenses(expenses.map(expense => (
        expense.id === editingExpenseId ? { ...expense, ...expenseDetails } : expense
      )));
      showToast(`💰 支出已更新 ${formatCurrency(convertToDisplayCurrency(parsedAmount, expCurrency))}`);
    } else {
      setExpenses([{
        id: `exp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...expenseDetails
      }, ...expenses]);
      showToast(`💰 已記錄支出 ${formatCurrency(convertToDisplayCurrency(parsedAmount, expCurrency))}`);
    }

    setEditingExpenseId(null);
    setExpTitle('');
    setExpCategory(EXPENSE_CATEGORIES[0]);
    setExpCurrency('JPY');
    setExpAmount('');
    setExpPaymentMethod('現金');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpNote('');
    setIsAddExpenseOpen(false);
  };

  const handleDeleteExpense = (id) => {
    const expense = expenses.find(item => item.id === id);
    if (!expense) return;
    requestConfirmation(
      '確認刪除支出？',
      `「${expense.title}」將被永久移除且無法復原。`,
      () => {
        setExpenses(expenses.filter(item => item.id !== id));
        showToast('已移除該筆支出');
      }
    );
  };

  const totalDisplayAmount = useMemo(() => {
    return expenses.reduce((sum, item) => {
      return sum + convertToDisplayCurrency(item.amount, item.currency);
    }, 0);
  }, [expenses, rates, displayCurrency]);

  const categorySpending = useMemo(() => {
    const breakdown: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach(c => { breakdown[c] = 0; });
    expenses.forEach(item => {
      const convertedAmount = convertToDisplayCurrency(item.amount, item.currency);
      if (breakdown[item.category] !== undefined) {
        breakdown[item.category] += convertedAmount;
      } else {
        breakdown[item.category] = convertedAmount;
      }
    });
    return breakdown;
  }, [expenses, rates, displayCurrency]);

  // ---------------- Handlers: 設定與備份匯出 ----------------
  const handleSaveRates = (e) => {
    e.preventDefault();
    const updated = {
      JPY: parseFloat(rateInputs.JPY) || rates.JPY,
      KRW: parseFloat(rateInputs.KRW) || rates.KRW,
      USD: parseFloat(rateInputs.USD) || rates.USD,
      EUR: parseFloat(rateInputs.EUR) || rates.EUR,
      TWD: 1.00
    };
    setRates(updated);
    showToast('✅ 匯率已更新，記帳金額已自動重新計算！');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const cat = newCategoryName.trim();
    if (!cat) return;
    if (categories.includes(cat)) {
      showToast('此分類已存在！', 'error');
      return;
    }
    setCategories([...categories, cat]);
    setNewCategoryName('');
    showToast(`已新增手帳分類「${cat}」`);
  };

  const handleDeleteCategory = (cat) => {
    if (categories.length <= 1) {
      showToast('請至少保留一個分類！', 'error');
      return;
    }
    requestConfirmation(
      '確認刪除分類？',
      `「${cat}」將從分類清單移除，既有手帳內容不會刪除。`,
      () => {
        setCategories(categories.filter(c => c !== cat));
        if (postCategory === cat) {
          setPostCategory(categories.find(c => c !== cat) || '景點漫遊');
        }
        showToast(`已移除分類「${cat}」`);
      }
    );
  };

  const handleExportJournalMarkdown = () => {
    let md = `# 📖 ktrip 旅跡・電子手帳旅誌\n`;
    md += `*匯出時間：${new Date().toLocaleString()} | 總篇數：${posts.length}*\n\n---\n\n`;

    posts.forEach((p, idx) => {
      md += `## #${idx + 1} 📍 ${p.location} [${p.category}]\n`;
      md += `- **時間**：${p.createdAt}\n`;
      if (p.mood) md += `- **心情/氛圍**：${p.mood}\n`;
      md += `\n${p.content}\n\n`;
      if (p.images && p.images.length > 0) {
        md += `### 📸 旅途相片\n`;
        p.images.forEach((img, i) => {
          md += `![旅拍${i + 1}](${img})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ktrip_Journal_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📄 手帳已匯出為 Markdown (.md) 檔案！');
  };

  const handleExportExpensesCSV = () => {
    const headers = ['記帳日期', '消費項目', '支出類別', '幣別', '原幣金額', '參考匯率', '折算台幣(TWD)', '支付方式', '備註說明'];
    const rows = expenses.map(item => {
      const activeRate = rates[item.currency] || 1;
      const twd = Math.round(item.amount * activeRate);
      return [
        `"${item.date}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${item.currency}"`,
        item.amount,
        activeRate,
        twd,
        `"${item.paymentMethod}"`,
        `"${(item.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ktrip_Expenses_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📊 記帳明細已匯出為 CSV 試算表！');
  };

  const handleBackupDatabase = () => {
    const backup = {
      appName: 'ktrip',
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      rates,
      categories,
      posts,
      itinerary,
      shoppingList,
      expenses,
      tripStartDate,
      displayCurrency
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ktrip_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 資料庫已完整備份為 JSON 檔案！');
  };

  const handleRestoreDatabase = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (typeof evt.target?.result !== 'string') {
          throw new Error('無法讀取備份檔案內容。');
        }
        const data = JSON.parse(evt.target.result);
        if (data.rates && data.posts && data.expenses) {
          setRates(data.rates);
          if (data.categories) setCategories(data.categories);
          setPosts(data.posts);
          if (data.itinerary) setItinerary(data.itinerary);
          if (data.shoppingList) setShoppingList(data.shoppingList);
          setExpenses(data.expenses);
          if (data.tripStartDate) setTripStartDate(data.tripStartDate);
          if (CURRENCIES.some(currency => currency.code === data.displayCurrency)) {
            setDisplayCurrency(data.displayCurrency);
          }
          showToast('🎉 資料庫還原成功！所有手帳、行程與記帳已恢復');
        } else {
          showToast('檔案格式不符，請選擇有效的 ktrip 備份檔案！', 'error');
        }
      } catch {
        showToast('讀取失敗，請確認檔案為合法的 JSON 格式！', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (window.confirm('確定要將手帳、行程、清單與記帳重置為最初預設的示範資料嗎？')) {
      setRates(INITIAL_RATES);
      setCategories(INITIAL_CATEGORIES);
      setPosts(INITIAL_POSTS);
      setItinerary(INITIAL_ITINERARY);
      setShoppingList(INITIAL_SHOPPING);
      setExpenses(INITIAL_EXPENSES);
      setTripStartDate(INITIAL_TRIP_START_DATE);
      setDisplayCurrency('TWD');
      showToast('🔄 已回復初始示範旅程紀錄');
    }
  };

  // 篩選手帳
  const filteredPosts = useMemo(() => {
    const query = feedSearch.trim().toLocaleLowerCase();
    return posts.filter(post => {
      const matchesFilter = feedFilterTag === 'ALL'
        || (feedFilterTag === 'BOOKMARKS' ? post.isBookmarked : post.category === feedFilterTag);
      const searchableText = [post.location, post.category, post.mood, post.content]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return matchesFilter && (!query || searchableText.includes(query));
    });
  }, [posts, feedFilterTag, feedSearch]);

  // 行程天數分組
  const groupedItinerary = useMemo(() => {
    const groups: Record<string, typeof itinerary> = {};
    itinerary.forEach(item => {
      const d = item.day || 'Day 1';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return groups;
  }, [itinerary]);

  // 篩選記帳
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense => expFilterCategory === 'ALL' || expense.category === expFilterCategory)
      .sort((a, b) => {
        const dateOrder = String(b.date || '').localeCompare(String(a.date || ''));
        if (dateOrder) return dateOrder;
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
  }, [expenses, expFilterCategory]);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`無法安裝 ktrip：${message}`, 'error');
    }
  };

  if (storageError) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-rose-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <AlertCircle className="w-5 h-5" />
            無法載入離線旅行資料
          </div>
          <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{storageError}</p>
          <p className="mt-2 text-xs text-neutral-400">為避免覆寫既有紀錄，ktrip 暫時不會載入示範資料。請確認瀏覽器允許 IndexedDB 與本機儲存後重新載入。</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-sm text-neutral-500">
        正在載入你的旅程紀錄…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-800 font-sans antialiased selection:bg-amber-100 selection:text-amber-900 pb-28">
      
      {/* 頂部通知 Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs sm:text-sm font-medium border backdrop-blur-md transition-all ${
          toast.type === 'error'
            ? 'bg-rose-50/95 text-rose-800 border-rose-200'
            : 'bg-neutral-900/90 text-white border-neutral-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 頂部極簡 App Bar (右上角顯示當天日期) */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/85 backdrop-blur-md border-b border-neutral-200/60">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-700 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-neutral-900 lowercase">ktrip</h1>
              <p className="text-[10px] text-neutral-400 font-medium">個人隨身旅行手帳</p>
            </div>
          </div>

          {/* 網路狀態、安裝入口與日期 */}
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-medium ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isOnline ? '已連線' : '離線可用'}
            </span>
            {installPromptEvent && (
              <button
                onClick={handleInstallApp}
                className="px-2.5 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-semibold hover:bg-neutral-700"
              >
                安裝
              </button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-200/60 border border-neutral-300/40 text-neutral-700 text-[11px] font-medium">
              <span>📅 {todayString}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="max-w-xl mx-auto px-4 pt-4">

        {/* ========================================================= */}
        {/* TAB 1: 手帳紀錄 (Feed)                                    */}
        {/* ========================================================= */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="search"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                placeholder="搜尋地點、分類或旅途回憶"
                aria-label="搜尋手帳紀錄"
                className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-xs text-neutral-800 placeholder:text-neutral-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>

            {/* 分類篩選橫向滾動列 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <button
                onClick={() => setFeedFilterTag('ALL')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                  feedFilterTag === 'ALL'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                全部手帳 ({posts.length})
              </button>
              <button
                onClick={() => setFeedFilterTag('BOOKMARKS')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 ${
                  feedFilterTag === 'BOOKMARKS'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <Bookmark className="w-3 h-3 fill-current" />
                <span>珍藏靈感</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFeedFilterTag(cat)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                    feedFilterTag === cat
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 手帳筆記卡片列表 */}
            <div className="space-y-3.5">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-neutral-300 p-6">
                  <Compass className="w-9 h-9 text-neutral-300 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-neutral-700">
                    {feedSearch || feedFilterTag !== 'ALL' ? '找不到符合條件的手帳' : '這趟旅途還沒有筆記'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {feedSearch || feedFilterTag !== 'ALL'
                      ? '試試其他關鍵字或切換分類。'
                      : '點擊右下角的「+」號，記錄當下的感動！'}
                  </p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <article
                    key={post.id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/90 shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all"
                  >
                    {/* 頂部資訊列：打卡地點、分類、心情、時間與動作 */}
                    <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                            <Tag className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span>{post.category}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{post.location}</span>
                          </span>

                          <span
                            className="text-base leading-none"
                            title={post.mood || '旅途心情'}
                            aria-label={post.mood || '旅途心情'}
                          >
                            {post.mood?.match(/\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*/u)?.[0] || '✨'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 pl-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{post.createdAt}</span>
                        </div>
                      </div>

                      {/* 編輯、珍藏與刪除 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
                          title="編輯手帳"
                          aria-label={`編輯手帳：${post.location}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBookmark(post.id)}
                          className={`p-1.5 rounded-xl transition-all ${
                            post.isBookmarked 
                              ? 'text-amber-500 bg-amber-50' 
                              : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                          }`}
                          title="珍藏手帳"
                        >
                          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => requestDeletePost(post)}
                          className="p-1.5 rounded-xl text-neutral-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 手帳筆記主體文字 */}
                    <div className="pt-3">
                      <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line tracking-wide">
                        {post.content}
                      </p>

                      {/* 多照片橫向滑動輪播區 (支援左右滑動與點擊燈箱放大) */}
                      {post.images && post.images.length > 0 && (
                        <div className="mt-3.5 relative">
                          <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory rounded-2xl scrollbar-none pb-1">
                            {post.images.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => openLightbox(post.images, i)}
                                aria-label={`查看相片：${post.location}`}
                                className="snap-center shrink-0 w-[82%] sm:w-[70%] aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer relative group border border-neutral-200 text-left"
                              >
                                <img
                                  src={img}
                                  alt="Travel snap"
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* 懸浮新增「+」按鈕 (FAB) */}
            <button
              onClick={handleOpenBottomSheet}
              aria-label="新增手帳筆記"
              className="fixed bottom-24 right-5 sm:right-[calc(50%-18rem)] z-40 w-14 h-14 rounded-full bg-neutral-900 text-white shadow-xl hover:bg-neutral-800 active:scale-90 transition-all flex items-center justify-center border-2 border-white/80 group"
            >
              <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 行程與購物清單 (Plan & Shopping)                    */}
        {/* ========================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            {/* 子分頁切換 */}
            <div className="flex bg-neutral-200/80 p-1 rounded-2xl">
              <button
                onClick={() => setPlanSubTab('itinerary')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  planSubTab === 'itinerary'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>每日行程規劃 ({itinerary.length})</span>
              </button>
              <button
                onClick={() => setPlanSubTab('shopping')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  planSubTab === 'shopping'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>心願購物清單 ({shoppingList.length})</span>
              </button>
            </div>

            {/* --- 行程規劃列表 --- */}
            {planSubTab === 'itinerary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500 font-medium">
                      {itineraryEditMode ? '編輯模式 · 拖曳 ≡ 可排序及跨天移動' : '依天數規劃行程'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setItineraryEditMode(mode => !mode)}
                      aria-label={itineraryEditMode ? '完成編輯行程' : '編輯行程排序與刪除'}
                      title={itineraryEditMode ? '完成編輯' : '編輯行程'}
                      className={`p-2 rounded-xl border shadow-2xs transition-all active:scale-95 ${
                        itineraryEditMode
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {itineraryEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                    {/* Markdown 批量匯入按鈕 */}
                    <button
                      onClick={() => setIsMdImportOpen(true)}
                      aria-label="Markdown 批量匯入"
                      title="Markdown 批量匯入"
                      className="p-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-all active:scale-95"
                    >
                      <FileCode className="w-4 h-4 text-indigo-600" />
                    </button>

                    <button
                      onClick={handleOpenNewItinerary}
                      aria-label="新增行程"
                      title="新增行程"
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {Object.keys(groupedItinerary).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-neutral-300 p-6">
                    <Compass className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">尚無行程排程，點擊右上角新增或透過 Markdown 批量匯入！</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={itinerarySensors}
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => handleReorderItinerary(active.id, over?.id)}
                  >
                    <SortableContext
                      items={itinerary.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                  {Object.entries(groupedItinerary).map(([dayTitle, items]) => (
                    <div key={dayTitle} className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-neutral-900 bg-amber-100/70 text-amber-900 px-2.5 py-0.5 rounded-full font-mono">
                            {dayTitle}
                          </span>
                          {getItineraryDateLabel(dayTitle, tripStartDate) && (
                            <span className="text-xs font-semibold text-neutral-500">
                              {getItineraryDateLabel(dayTitle, tripStartDate)}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {items.filter(i => i.completed).length}/{items.length} 完成
                        </span>
                      </div>

                      <div className="space-y-2">
                        {items.map(item => (
                          <SortableItineraryCard key={item.id} id={item.id} editMode={itineraryEditMode}>
                          <div
                            className={`p-2.5 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                              item.completed
                                ? 'bg-neutral-50/70 border-neutral-200 opacity-60'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={() => handleToggleItinerary(item.id)}
                                className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                  item.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-neutral-300 hover:border-neutral-500'
                                }`}
                              >
                                {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {item.time && (
                                    <span className="text-[11px] font-mono text-neutral-400 shrink-0 font-medium">
                                      {item.time}
                                    </span>
                                  )}
                                  <span className={`text-xs font-bold truncate ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                                    {item.location}
                                  </span>
                                </div>
                                {item.note && (
                                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center shrink-0">
                              <button
                                onClick={() => handleEditItinerary(item)}
                                className="text-neutral-400 hover:text-neutral-800 p-1 rounded-lg"
                                title="編輯行程"
                                aria-label={`編輯行程：${item.location}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {itineraryEditMode && (
                                <button
                                  onClick={() => handleDeleteItinerary(item.id)}
                                  className="text-neutral-300 hover:text-rose-500 p-1 rounded-lg"
                                  title="刪除"
                                  aria-label={`刪除行程：${item.location}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          </SortableItineraryCard>
                        ))}
                      </div>
                    </div>
                  ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}

            {/* --- 購物清單列表 --- */}
            {planSubTab === 'shopping' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">旅行伴手禮與心願採購</span>
                  <button
                    onClick={handleOpenNewShopping}
                    aria-label="新增購物項目"
                    title="新增購物項目"
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-2xs space-y-2">
                  {shoppingList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-neutral-400">目前沒有心願清單</div>
                  ) : (
                    shoppingList.map(item => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          item.bought
                            ? 'bg-neutral-50 border-neutral-200 opacity-60'
                            : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleShopping(item.id)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                              item.bought
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-neutral-300 hover:border-neutral-500'
                            }`}
                          >
                            {item.bought && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0">
                            <span className={`text-xs font-bold block truncate ${item.bought ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                              {item.item}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              📍 {item.store} • 預估 {item.estimatedPrice}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center shrink-0">
                          <button
                            onClick={() => handleEditShopping(item)}
                            className="text-neutral-400 hover:text-neutral-800 p-1 rounded-lg"
                            title="編輯購物項目"
                            aria-label={`編輯購物項目：${item.item}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteShopping(item.id)}
                            className="text-neutral-300 hover:text-rose-500 p-1 rounded-lg"
                            title="刪除"
                            aria-label={`刪除購物項目：${item.item}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 旅費記帳 (Expenses)                                */}
        {/* ========================================================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* 總花費儀表板卡片 */}
            <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                    總支出估計 ({displayCurrency})
                  </span>
                  <span className="text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-mono">
                    自動外幣折算
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl font-extrabold tracking-tight font-mono">
                    {formatCurrency(totalDisplayAmount)}
                  </span>
                  <span className="text-xs text-neutral-400 font-normal">
                    ({expenses.length} 筆明細)
                  </span>
                </div>

                {/* 分類進度條 */}
                <div className="mt-4 pt-3 border-t border-neutral-800">
                  <div className="text-[11px] text-neutral-400 mb-1.5 flex justify-between">
                    <span>支出類別佔比</span>
                    <span className="font-mono">{EXPENSE_CATEGORIES.length} 類別</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.slice(0, 3).map(cat => {
                      const amount = categorySpending[cat] || 0;
                      const pct = totalDisplayAmount > 0 ? Math.round((amount / totalDisplayAmount) * 100) : 0;
                      return (
                        <div key={cat} className="bg-neutral-800/80 p-2 rounded-xl border border-neutral-700/50">
                          <span className="text-[10px] text-neutral-400 block truncate">{cat}</span>
                          <span className="text-xs font-bold font-mono text-white block">{formatCurrency(amount)}</span>
                          <div className="w-full bg-neutral-700 h-1 rounded-full mt-1 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleOpenNewExpense}
                  className="w-full mt-4 bg-white text-neutral-900 hover:bg-neutral-100 font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>記錄新支出</span>
                </button>
              </div>
            </div>

            {/* 記帳流水帳列表 */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-neutral-900">消費流水帳</h3>
                <select
                  value={expFilterCategory}
                  onChange={(e) => setExpFilterCategory(e.target.value)}
                  className="text-xs bg-neutral-100 border border-neutral-200 rounded-xl px-2.5 py-1 focus:outline-none text-neutral-700"
                >
                  <option value="ALL">全部類別</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="divide-y divide-neutral-100">
                {filteredExpenses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">尚無記帳紀錄</div>
                ) : (
                  filteredExpenses.map(item => {
                    const convertedAmount = convertToDisplayCurrency(item.amount, item.currency);
                    return (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-xs font-semibold shrink-0">
                            {item.category === '餐飲美食' && '🍜'}
                            {item.category === '交通運輸' && '🚇'}
                            {item.category === '購物開箱' && '🛍️'}
                            {item.category === '住宿旅店' && '🏨'}
                            {item.category === '門票景點' && '🎟️'}
                            {item.category === '生活其他' && '🪙'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-neutral-800">{item.title}</span>
                              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                                {item.paymentMethod}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 block">
                              {item.date} {item.note && `• ${item.note}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right font-mono">
                            <span className="font-bold text-xs text-neutral-900 block">{formatCurrency(item.amount, item.currency)}</span>
                            <span className="text-[10px] text-neutral-400 block">≈ {formatCurrency(convertedAmount)}</span>
                          </div>
                          <div className="flex items-center shrink-0">
                            <button
                              onClick={() => handleEditExpense(item)}
                              className="text-neutral-400 hover:text-neutral-800 p-1 rounded"
                              title="編輯支出"
                              aria-label={`編輯支出：${item.title}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(item.id)}
                              className="text-neutral-300 hover:text-rose-500 p-1 rounded"
                              title="刪除"
                              aria-label={`刪除支出：${item.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: 系統設定 (Settings)                                */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">旅程日期</h3>
                  <p className="text-[11px] text-neutral-400">設定出發日，自動顯示每日行程日期與星期</p>
                </div>
              </div>
              <div>
                <label htmlFor="trip-start-date" className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  旅程開始日
                </label>
                <input
                  id="trip-start-date"
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">預設顯示幣別</h3>
                  <p className="text-[11px] text-neutral-400">切換旅費總額、分類與單筆折算的顯示幣別</p>
                </div>
              </div>
              <div>
                <label htmlFor="display-currency" className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  顯示幣別
                </label>
                <select
                  id="display-currency"
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1. 自訂手帳分類管理 */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">手帳分類自訂</h3>
                    <p className="text-[11px] text-neutral-400">隨心新增或移除專屬旅行分類標籤</p>
                  </div>
                </div>
              </div>

              {/* 現有分類標籤清單 */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-neutral-400 hover:text-rose-500 transition-colors"
                      title="刪除分類"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* 新增分類 */}
              <form onSubmit={handleAddCategory} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="輸入新分類名稱 (例: 咖啡巡禮、神社祈福)"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs shrink-0"
                >
                  新增分類
                </button>
              </form>
            </div>

            {/* 2. 手動匯率設定 */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">手動匯率設定</h3>
                    <p className="text-[11px] text-neutral-400">自訂外幣對台幣 (TWD) 匯率</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  基準幣: TWD
                </span>
              </div>

              <form onSubmit={handleSaveRates} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">🇯🇵 1 JPY = ? TWD</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rateInputs.JPY}
                      onChange={(e) => setRateInputs({ ...rateInputs, JPY: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">🇰🇷 1 KRW = ? TWD</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rateInputs.KRW}
                      onChange={(e) => setRateInputs({ ...rateInputs, KRW: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">🇺🇸 1 USD = ? TWD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateInputs.USD}
                      onChange={(e) => setRateInputs({ ...rateInputs, USD: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">🇪🇺 1 EUR = ? TWD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateInputs.EUR}
                      onChange={(e) => setRateInputs({ ...rateInputs, EUR: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setRateInputs({
                      JPY: String(INITIAL_RATES.JPY),
                      KRW: String(INITIAL_RATES.KRW),
                      USD: String(INITIAL_RATES.USD),
                      EUR: String(INITIAL_RATES.EUR)
                    })}
                    className="text-[11px] text-neutral-400 hover:text-neutral-700 underline"
                  >
                    還原預設參考值
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    更新匯率並重算
                  </button>
                </div>
              </form>
            </div>

            {/* 3. 資料匯出與備份管理專區 */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">資料備份與匯出管理</h3>
                  <p className="text-[11px] text-neutral-400">支援 Markdown、CSV 試算表與完整 JSON 備份</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 匯出手帳 */}
                <button
                  onClick={handleExportJournalMarkdown}
                  className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-800 block">手帳資料匯出</span>
                      <span className="text-[10px] text-neutral-400">Markdown (.md) 旅誌</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400" />
                </button>

                {/* 匯出記帳 */}
                <button
                  onClick={handleExportExpensesCSV}
                  className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-700">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-800 block">記帳資料匯出</span>
                      <span className="text-[10px] text-neutral-400">Excel 相容 CSV 試算表</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400" />
                </button>

                {/* 資料庫備份 */}
                <button
                  onClick={handleBackupDatabase}
                  className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-700">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-800 block">資料庫備份</span>
                      <span className="text-[10px] text-neutral-400">下載完整 JSON 備份檔案</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400" />
                </button>

                {/* 資料庫還原 */}
                <button
                  onClick={() => restoreFileRef.current?.click()}
                  className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-700">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-800 block">資料庫還原</span>
                      <span className="text-[10px] text-neutral-400">讀取 JSON 檔案復原</span>
                    </div>
                  </div>
                  <Upload className="w-4 h-4 text-neutral-400" />
                </button>
                <input
                  type="file"
                  ref={restoreFileRef}
                  onChange={handleRestoreDatabase}
                  accept=".json"
                  className="hidden"
                />
              </div>

              {/* 重置示範資料 */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">重設回初始示範旅行紀錄</span>
                <button
                  onClick={handleResetDemo}
                  className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>重置示範資料</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-neutral-200 text-center space-y-3"
          >
            <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirmation-title" className="font-bold text-sm text-neutral-900">{confirmDialog.title}</h3>
              <p className="text-xs text-neutral-400 mt-1">{confirmDialog.message}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={closeConfirmation}
                className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 燈箱全螢幕放大相片檢視 (Lightbox Modal)                    */}
      {/* ========================================================= */}
      {lightbox.isOpen && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 select-none"
        >
          {/* 燈箱頂部 */}
          <div className="flex items-center justify-between text-white max-w-xl mx-auto w-full pt-2">
            <span className="text-xs font-mono text-neutral-400">
              {lightbox.currentIndex + 1} / {lightbox.images.length}
            </span>
            <button
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 燈箱中央主圖 */}
          <div className="flex-1 flex items-center justify-center relative max-w-2xl mx-auto w-full">
            <img
              src={lightbox.images[lightbox.currentIndex]}
              alt="Expanded snap"
              onClick={(event) => event.stopPropagation()}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {lightbox.images.length > 1 && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    prevLightboxImage();
                  }}
                  className="absolute left-2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-xs"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    nextLightboxImage();
                  }}
                  className="absolute right-2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-xs"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* 燈箱底部縮圖 */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-4 max-w-xl mx-auto w-full">
            {lightbox.images.map((img, idx) => (
              <button
                key={idx}
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox(prev => ({ ...prev, currentIndex: idx }));
                }}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  lightbox.currentIndex === idx ? 'border-white scale-105' : 'border-transparent opacity-50'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 底部滑出抽屜頁面 (Bottom Sheet) - 新增手帳筆記             */}
      {/* ========================================================= */}
      {isBottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setIsBottomSheetOpen(false)} />

          <div className="relative w-full max-w-xl bg-white rounded-t-[28px] p-5 sm:p-6 shadow-2xl border-t border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-4" />

            <div className="grid grid-cols-3 items-center pb-3 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => setIsBottomSheetOpen(false)}
                className="justify-self-start text-sm text-neutral-500 hover:text-neutral-900"
              >
                取消
              </button>
              <h3 className="justify-self-center font-bold text-sm text-neutral-900">
                {editingPostId ? '編輯手帳' : '新增手帳'}
              </h3>
              <span />
            </div>

            <form onSubmit={handleCreatePost} className="mt-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="分享旅途中的新鮮事..."
                  rows={5}
                  className="min-h-32 flex-1 text-sm placeholder:text-neutral-400 focus:outline-none resize-y leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="mt-3 flex items-center gap-1 border-t border-neutral-100 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="新增照片"
                  title="新增照片"
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-emerald-700"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPostComposerFields(fields => ({ ...fields, location: !fields.location }))}
                  aria-label="新增地點"
                  title="新增地點"
                  aria-pressed={postComposerFields.location}
                  className={`p-2 rounded-xl hover:bg-neutral-100 ${postComposerFields.location ? 'text-rose-600 bg-rose-50' : 'text-neutral-500'}`}
                >
                  <MapPin className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPostComposerFields(fields => ({ ...fields, category: !fields.category }))}
                  aria-label="新增分類"
                  title="新增分類"
                  aria-pressed={postComposerFields.category}
                  className={`p-2 rounded-xl hover:bg-neutral-100 ${postComposerFields.category ? 'text-amber-700 bg-amber-50' : 'text-neutral-500'}`}
                >
                  <Tag className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPostComposerFields(fields => ({ ...fields, mood: !fields.mood }))}
                  aria-label="新增心情"
                  title="新增心情"
                  aria-pressed={postComposerFields.mood}
                  className={`p-2 rounded-xl hover:bg-neutral-100 ${postComposerFields.mood ? 'text-violet-700 bg-violet-50' : 'text-neutral-500'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <span className="ml-auto text-[11px] text-neutral-400">
                  {selectedImages.length > 0 ? `已選 ${selectedImages.length} 張照片` : '新增內容'}
                </span>
              </div>

              {postComposerFields.location && (
                <div className="mt-3">
                  <label htmlFor="post-location" className="sr-only">打卡定位地點</label>
                  <input
                    id="post-location"
                    type="text"
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    placeholder="輸入地點"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              )}

              {postComposerFields.category && (
                <div className="mt-3">
                  <label htmlFor="post-category" className="sr-only">手帳分類標籤</label>
                  <select
                    id="post-category"
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50/50 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {postComposerFields.mood && (
                <div className="mt-3">
                  <label htmlFor="post-mood" className="sr-only">旅行心情與天氣氛圍</label>
                  <input
                    id="post-mood"
                    type="text"
                    value={postMood}
                    onChange={(e) => setPostMood(e.target.value)}
                    placeholder="記下當下的心情或天氣"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              )}

              {selectedImages.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-neutral-200 group">
                        <img src={img} alt={`已選相片 ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => requestConfirmation(
                            '確認移除照片？',
                            '這張照片會從目前編輯中的手帳移除。',
                            () => setSelectedImages(images => images.filter((_, idx) => idx !== i)),
                            '確認移除'
                          )}
                          aria-label={`移除第 ${i + 1} 張照片`}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end border-t border-neutral-100 pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold shadow-sm"
                >
                  {editingPostId ? '儲存' : '發布'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Markdown 批量匯入行程彈窗 (Markdown Bulk Import Modal)     */}
      {/* ========================================================= */}
      {isMdImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">透過 Markdown 批量匯入行程</h3>
                  <p className="text-[11px] text-neutral-400">貼上 Markdown 筆記快速轉化為每日行程排程</p>
                </div>
              </div>
              <button
                onClick={() => setIsMdImportOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {/* 格式說明與一鍵範例 */}
              <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                    支援的 Markdown 語法格式：
                  </span>
                  <button
                    type="button"
                    onClick={() => setMdInputText(SAMPLE_MARKDOWN_ITINERARY)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                  >
                    載入範例格式
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  • 天數標題：<code># Day 1</code>、<code>## Day 2: 嵐山</code>、<code>**Day 3**</code><br />
                  • 行程項目：<code>- 09:30 清水寺 | 和服體驗</code> 或 <code>- [ ] 14:00 景點 (備忘：...)</code>
                </p>
              </div>

              {/* 輸入框 */}
              <div>
                <textarea
                  value={mdInputText}
                  onChange={(e) => setMdInputText(e.target.value)}
                  placeholder={`請在此貼上 Markdown 行程文本...\n\n# Day 1\n- 09:30 清水寺 | 和服體驗\n- 12:00 錦市場: 道地美食`}
                  rows={8}
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-900 resize-none leading-relaxed"
                />
              </div>

              {/* 即時解析預覽與計數 */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-amber-900 block">
                    即時解析結果：偵測到 {parsedMarkdownItems.length} 項行程
                  </span>
                  <span className="text-[10px] text-amber-700">
                    {parsedMarkdownItems.length > 0 
                      ? `包含：${Array.from(new Set(parsedMarkdownItems.map(i => i.day))).join('、')}` 
                      : '尚未偵測到行程項目'}
                  </span>
                </div>
                {parsedMarkdownItems.length > 0 && (
                  <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-mono font-bold">
                    準備就緒
                  </span>
                )}
              </div>

              {/* 匯入模式選擇 */}
              <div className="flex items-center gap-4 text-xs pt-1">
                <span className="font-semibold text-neutral-700">匯入模式：</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-neutral-900"
                  />
                  <span>追加至現有行程</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-neutral-900"
                  />
                  <span className="text-rose-600 font-medium">替換全部行程</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex gap-2">
              <button
                type="button"
                onClick={() => setIsMdImportOpen(false)}
                className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkdownImport}
                disabled={parsedMarkdownItems.length === 0}
                className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-bold transition-all shadow-xs"
              >
                確認匯入 ({parsedMarkdownItems.length} 項)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 新增單筆行程彈窗 (Add Single Itinerary Modal)               */}
      {/* ========================================================= */}
      {isAddItineraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">
                {editingItineraryId ? '編輯行程' : '新增行程排程'}
              </h3>
              <button
                onClick={() => {
                  setIsAddItineraryOpen(false);
                  setEditingItineraryId(null);
                }}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSingleItinerary} className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">天數分組</label>
                  <input
                    type="text"
                    value={newItDay}
                    onChange={(e) => setNewItDay(e.target.value)}
                    placeholder="例如: Day 1"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">時間</label>
                  <input
                    type="text"
                    value={newItTime}
                    onChange={(e) => setNewItTime(e.target.value)}
                    placeholder="例如: 10:30"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">景點或活動名稱 *</label>
                <input
                  type="text"
                  value={newItLocation}
                  onChange={(e) => setNewItLocation(e.target.value)}
                  placeholder="例如: 清水寺參拜、八坂神社"
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">行程備忘 / 備註</label>
                <input
                  type="text"
                  value={newItNote}
                  onChange={(e) => setNewItNote(e.target.value)}
                  placeholder="例如: 門票 400 JPY、搭乘公車 206 號"
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddItineraryOpen(false);
                    setEditingItineraryId(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold"
                >
                  {editingItineraryId ? '儲存修改' : '儲存行程'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 新增心願購物項目彈窗 (Add Shopping Item Modal)             */}
      {/* ========================================================= */}
      {isAddShoppingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">
                {editingShoppingId ? '編輯購物項目' : '新增心願清單'}
              </h3>
              <button
                onClick={() => {
                  setIsAddShoppingOpen(false);
                  setEditingShoppingId(null);
                }}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShopping} className="space-y-3 mt-3">
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">心願商品名稱 *</label>
                <input
                  type="text"
                  value={newShopItem}
                  onChange={(e) => setNewShopItem(e.target.value)}
                  placeholder="例如: 抹茶蛋捲禮盒、經典香水"
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">目標店家 / 地點</label>
                  <input
                    type="text"
                    value={newShopStore}
                    onChange={(e) => setNewShopStore(e.target.value)}
                    placeholder="例如: 祇園辻利"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">預估價格</label>
                  <input
                    type="text"
                    value={newShopPrice}
                    onChange={(e) => setNewShopPrice(e.target.value)}
                    placeholder="例如: 1,800 JPY"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddShoppingOpen(false);
                    setEditingShoppingId(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold"
                >
                  {editingShoppingId ? '儲存修改' : '儲存購物項目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 新增支出彈窗 (Expense Modal)                              */}
      {/* ========================================================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-neutral-700" />
                {editingExpenseId ? '編輯旅途花費' : '新增旅途花費'}
              </h3>
              <button
                onClick={() => {
                  setIsAddExpenseOpen(false);
                  setEditingExpenseId(null);
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 mt-3">
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">項目名稱 *</label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="例: 清水寺門票、拉麵晚餐"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">支出分類</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">支付方式</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  >
                    <option value="現金">💵 現金</option>
                    <option value="信用卡">💳 信用卡</option>
                    <option value="交通卡/IC">📱 交通卡/IC</option>
                    <option value="行動支付">📲 行動支付</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">幣別</label>
                  <select
                    value={expCurrency}
                    onChange={(e) => setExpCurrency(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none"
                  >
                    <option value="JPY">JPY 日圓</option>
                    <option value="KRW">KRW 韓元</option>
                    <option value="USD">USD 美元</option>
                    <option value="EUR">EUR 歐元</option>
                    <option value="TWD">TWD 台幣</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">原幣金額 *</label>
                  <input
                    type="number"
                    step="any"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="例: 1400"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
              </div>

              {/* 即時匯率折算 */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-amber-900">
                  匯率 1 {expCurrency} ≈ {rates[expCurrency] || 1} TWD
                </span>
                <span className="font-mono font-bold text-amber-950">
                  ≈ {formatCurrency(estimatedDisplayAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">日期</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">備註說明</label>
                  <input
                    type="text"
                    value={expNote}
                    onChange={(e) => setExpNote(e.target.value)}
                    placeholder="例如: 兩人份"
                    className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExpenseOpen(false);
                    setEditingExpenseId(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
                >
                  {editingExpenseId ? '儲存修改' : '儲存支出'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 固定懸浮毛玻璃純圖示底部導覽列 (Icon-Only Dock)             */}
      {/* ========================================================= */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[84%] max-w-sm bg-white/85 backdrop-blur-xl border border-neutral-200/80 shadow-lg shadow-neutral-900/5 rounded-full p-2 flex items-center justify-around">
        {/* 1. 手帳紀錄 */}
        <button
          onClick={() => setActiveTab('feed')}
          aria-label="手帳紀錄"
          title="手帳紀錄"
          className={`p-3 rounded-full transition-all relative ${
            activeTab === 'feed'
              ? 'bg-neutral-900 text-white shadow-xs scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          {activeTab === 'feed' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* 2. 行程與購物清單 */}
        <button
          onClick={() => setActiveTab('plans')}
          aria-label="行程與購物清單"
          title="行程與購物清單"
          className={`p-3 rounded-full transition-all relative ${
            activeTab === 'plans'
              ? 'bg-neutral-900 text-white shadow-xs scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          {activeTab === 'plans' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* 3. 旅費記帳 */}
        <button
          onClick={() => setActiveTab('expenses')}
          aria-label="旅費記帳"
          title="旅費記帳"
          className={`p-3 rounded-full transition-all relative ${
            activeTab === 'expenses'
              ? 'bg-neutral-900 text-white shadow-xs scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          {activeTab === 'expenses' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* 4. 系統設定 */}
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="系統設定"
          title="系統設定"
          className={`p-3 rounded-full transition-all relative ${
            activeTab === 'settings'
              ? 'bg-neutral-900 text-white shadow-xs scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
          }`}
        >
          <Sliders className="w-5 h-5" />
          {activeTab === 'settings' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
          )}
        </button>
      </nav>

    </div>
  );
}