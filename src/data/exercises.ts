export interface Exercise {
  id: string;
  name: string;
  category: 'upper' | 'lower' | 'core' | 'full' | 'cardio';
  description: string;
  instructions: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image: string;
  videoUrl?: string;
}

export const EXERCISES: Exercise[] = [
  {
    id: 'pushups',
    name: 'Şınav',
    category: 'upper',
    description: 'Göğüs, omuz ve triceps kaslarını çalıştırır.',
    instructions: '1. Ellerinizi omuz genişliğinde yere koyun.\n2. Vücudunuzu düz bir çizgi halinde tutun.\n3. Dirseklerinizi bükerek göğsünüzü yere yaklaştırın.\n4. Kollarınızı düzelterek başlangıç pozisyonuna dönün.',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'IODxDxX7oi4'
  },
  {
    id: 'squats',
    name: 'Squat (Çömelme)',
    category: 'lower',
    description: 'Bacak ve kalça kaslarını güçlendirir.',
    instructions: '1. Ayaklarınızı omuz genişliğinde açın.\n2. Kalçanızı geriye doğru iterek sanki bir sandalyeye oturuyormuş gibi alçalın.\n3. Dizlerinizin ayak parmak uçlarınızı geçmediğinden emin olun.\n4. Topuklarınızdan güç alarak ayağa kalkın.',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'aclHkVaku9U'
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    description: 'Karın kaslarını ve core bölgesini stabilize eder.',
    instructions: '1. Ön kollarınızın üzerinde şınav pozisyonu alın.\n2. Vücudunuzu baştan topuğa kadar düz tutun.\n3. Karın kaslarınızı sıkın ve bu pozisyonu koruyun.\n4. Belinizin aşağı sarkmasına izin vermeyin.',
    difficulty: 'beginner',
    image: 'https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg?auto=compress&cs=tinysrgb&w=800',
    videoUrl: 'pSHjTRCQxIw'
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'cardio',
    description: 'Tüm vücudu çalıştıran ve nabzı yükselten başlangıç seviyesi kardiyo.',
    instructions: '1. Ayaklarınız bitişik, kollarınız yanlarda dik durun.\n2. Zıplayarak ayaklarınızı omuz genişliğinden fazla açın ve kollarınızı başınızın üzerinde birleştirin.\n3. Tekrar zıplayarak başlangıç pozisyonuna dönün.',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'iSSAk4XCs_4'
  },
  {
    id: 'lunges',
    name: 'Lunge (Adımlama)',
    category: 'lower',
    description: 'Dengeyi geliştirir ve bacakları şekillendirir.',
    instructions: '1. Dik durun ve bir adım öne atın.\n2. Her iki diziniz de 90 derece bükülene kadar alçalın.\n3. Arka diziniz yere değmemelidir.\n4. Başlangıç pozisyonuna dönün ve diğer bacakla tekrarlayın.',
    difficulty: 'beginner',
    image: 'https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'QOVaHwm-Q6U'
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'cardio',
    description: 'Kalp atış hızını artırır ve core bölgesini çalıştırır.',
    instructions: '1. Şınav pozisyonu alın.\n2. Bir dizinizi göğsünüze doğru çekin.\n3. Hızlıca bacak değiştirin, sanki yerde koşuyormuş gibi yapın.\n4. Sırtınızı düz tutun ve kalçanızı yukarı kaldırmayın.',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'nmwgirgXLYM'
  },
  {
    id: 'diamond-pushups',
    name: 'Diamond Şınav',
    category: 'upper',
    description: 'Triceps (arka kol) kaslarını hedefleyen zorlu bir şınav varyasyonu.',
    instructions: '1. Ellerinizi göğsünüzün altında birleştirerek baş parmak ve işaret parmaklarınızla bir elmas şekli oluşturun.\n2. Vücudunuzu düz tutarak alçalın.\n3. Dirseklerinizi vücudunuza yakın tutarak yukarı itin.',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'J0DnG1_S92I'
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'core',
    description: 'Yan karın kaslarını (oblikler) güçlendirir.',
    instructions: '1. Yere oturun, dizlerinizi bükün ve ayaklarınızı hafifçe yerden kaldırın.\n2. Gövdenizi hafifçe geriye yaslayın.\n3. Ellerinizi birleştirin ve gövdenizi sağa ve sola döndürerek ellerinizi yere yaklaştırın.',
    difficulty: 'intermediate',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'LSq3U7aG_8Y'
  },
  {
    id: 'burpees',
    name: 'Burpee',
    category: 'full',
    description: 'Tüm vücudu çalıştıran yüksek yoğunluklu kardiyo hareketi.',
    instructions: '1. Ayakta durun, sonra çömelin ve ellerinizi yere koyun.\n2. Ayaklarınızı geriye fırlatarak şınav pozisyonuna geçin.\n3. Hemen ayaklarınızı ellerinizin yanına çekin.\n4. Patlayıcı bir şekilde yukarı zıplayın ve ellerinizi başınızın üzerinde birleştirin.',
    difficulty: 'advanced',
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'dZgVxmf6jkA'
  }
];