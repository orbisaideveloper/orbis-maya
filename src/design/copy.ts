import type { Locale } from '../i18n'
const bn = {
  title: 'অর্বিস অ্যাস্ট্রো', subtitle: 'স্বপ্নের ভেতর লুকানো অর্থ, জীবনের পথে আলোর সন্ধান।',
  morning: 'শুভ সকাল', afternoon: 'শুভ অপরাহ্ণ', evening: 'শুভ সন্ধ্যা',
  dream: 'স্বপ্ন বিশ্লেষণ', astro: 'জ্যোতিষ নির্দেশনা', chat: 'Ask Maya',
  saved: 'সংরক্ষিত ইনসাইট', today: 'আজকের শুভ নির্দেশ', settings: 'সেটিংস',
  dreamBody: 'আপনার স্বপ্নের গভীর অর্থ জানুন', astroBody: 'আপনার জীবনের পথ ও সম্ভাবনা',
  chatBody: 'মায়ার সঙ্গে কথা বলুন', savedBody: 'আপনার বিশ্লেষণ এক জায়গায়',
  todayBody: 'দিনের নির্দেশনা ও অন্তর্দৃষ্টি', settingsBody: 'আপনার তথ্য ও পছন্দের সেটিংস',
  insight: 'আজকের ইনসাইট', waiting: 'ইনসাইটের অপেক্ষায়',
  waitingBody: 'পরিষেবা সংযুক্ত হলে আপনার ব্যক্তিগত ইনসাইট এখানে দেখাবে।',
  analysis: 'সম্পূর্ণ বিশ্লেষণ দেখুন', home: 'হোম', dreams: 'স্বপ্নসমূহ', astrology: 'জ্যোতিষ',
  conversation: 'চ্যাট', profile: 'প্রোফাইল', notifications: 'নোটিফিকেশন',
  noNotifications: 'এখন কোনও নোটিফিকেশন নেই।', theme: 'থিম নির্বাচন করুন',
  privacy: 'প্রাইভেসি', privacyBody: 'ব্যক্তিগত ইতিহাস এই ডিভাইসেই থাকে। থিম বদলালে ইতিহাস বদলায় না।',
  pending: 'পরিষেবার সংযোগ বাকি', writeDream: 'নিজের স্বপ্ন লিখুন', dreamPlaceholder: 'এখানে আপনার স্বপ্নের বিবরণ লিখুন…',
  birthDate: 'জন্ম তারিখ', birthTime: 'জন্ম সময়', birthPlace: 'জন্মস্থান',
  ask: 'কী জানতে চান?', askPlaceholder: 'আপনার প্রশ্ন লিখুন…',
  savedEmpty: 'এখনও কোনও ইনসাইট সংরক্ষণ করা হয়নি।', guidanceEmpty: 'আজকের নির্দেশ এখনও পাওয়া যায়নি।',
  designOnly: 'ডিজাইন প্রিভিউ • ব্যক্তিগত ফল তৈরি হচ্ছে না',
  workspace: 'Astro ডিজাইন workspace', development: 'Development view', published: 'Published view',
  noPublished: 'এখনও কোনও প্রকাশিত সংস্করণ সংযুক্ত নেই।', publish: 'Publish',
  releasePending: 'প্রকাশের জন্য আলাদা pinned release ও owner authorization সংযোগ বাকি।',
  viewApp: 'অ্যাপ খুলুন', notificationsBody: 'নোটিফিকেশন পরিষেবা সংযুক্ত হলে এখানে পছন্দ বদলাতে পারবেন।',
  savedLogin: 'আপনার সংরক্ষিত ইনসাইট দেখতে অ্যাকাউন্টে লগইন করুন।',
} as const
const en = {
  title:'Orbis Astro', subtitle:'Meaning within dreams. Light for the path ahead.', morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening',
  dream:'Dream Analysis',astro:'Astrology Guidance',chat:'Ask Maya',saved:'Saved Insights',today:"Today’s Guidance",settings:'Settings',
  dreamBody:'Explore the meaning of your dreams',astroBody:'Your path and possibilities',chatBody:'Talk with Maya',savedBody:'Your insights in one place',todayBody:'Daily guidance and reflection',settingsBody:'Your account and preferences',
  insight:"Today’s insight",waiting:'Waiting for an insight',waitingBody:'Your personal insight will appear when services are connected.',analysis:'View full analysis',home:'Home',dreams:'Dreams',astrology:'Astro',conversation:'Chat',profile:'Profile',notifications:'Notifications',noNotifications:'No notifications right now.',theme:'Choose a theme',privacy:'Privacy',privacyBody:'Personal history stays on this device. Changing themes does not change history.',pending:'Service connection pending',writeDream:'Write your dream',dreamPlaceholder:'Describe your dream here…',birthDate:'Birth date',birthTime:'Birth time',birthPlace:'Birth place',ask:'What would you like to know?',askPlaceholder:'Write your question…',savedEmpty:'No insights have been saved yet.',guidanceEmpty:'Daily guidance is not available yet.',designOnly:'Design preview • No personal results generated',workspace:'Astro design workspace',development:'Development view',published:'Published view',noPublished:'No published release has been connected.',publish:'Publish',releasePending:'Separate pinned release and owner authorization are not connected yet.',viewApp:'Open app',notificationsBody:'Notification preferences will be available when the service is connected.',savedLogin:'Sign in to see your saved insights.',
} satisfies Record<keyof typeof bn,string>
const hi = {
  title:'ऑर्बिस ऐस्ट्रो',subtitle:'सपनों का अर्थ, जीवन की राह में उजाला।',morning:'सुप्रभात',afternoon:'शुभ दोपहर',evening:'शुभ संध्या',dream:'सपना विश्लेषण',astro:'ज्योतिष मार्गदर्शन',chat:'Ask Maya',saved:'सहेजी गई इनसाइट',today:'आज का मार्गदर्शन',settings:'सेटिंग्स',dreamBody:'अपने सपनों का अर्थ जानें',astroBody:'आपकी राह और संभावनाएँ',chatBody:'माया से बात करें',savedBody:'आपकी इनसाइट एक जगह',todayBody:'दैनिक मार्गदर्शन',settingsBody:'अकाउंट और पसंद',insight:'आज की इनसाइट',waiting:'इनसाइट की प्रतीक्षा',waitingBody:'सेवाएँ जुड़ने के बाद व्यक्तिगत इनसाइट यहाँ दिखेगी।',analysis:'पूरा विश्लेषण देखें',home:'होम',dreams:'सपने',astrology:'ज्योतिष',conversation:'चैट',profile:'प्रोफ़ाइल',notifications:'सूचनाएँ',noNotifications:'अभी कोई सूचना नहीं है।',theme:'थीम चुनें',privacy:'गोपनीयता',privacyBody:'व्यक्तिगत इतिहास इसी डिवाइस पर रहता है। थीम बदलने से इतिहास नहीं बदलता।',pending:'सेवा का कनेक्शन बाकी है',writeDream:'अपना सपना लिखें',dreamPlaceholder:'अपने सपने का विवरण लिखें…',birthDate:'जन्म तारीख',birthTime:'जन्म समय',birthPlace:'जन्म स्थान',ask:'क्या जानना चाहते हैं?',askPlaceholder:'अपना सवाल लिखें…',savedEmpty:'अभी कोई इनसाइट सहेजी नहीं गई है।',guidanceEmpty:'आज का मार्गदर्शन अभी उपलब्ध नहीं है।',designOnly:'डिज़ाइन प्रीव्यू • व्यक्तिगत परिणाम नहीं बन रहे',workspace:'Astro डिज़ाइन workspace',development:'Development view',published:'Published view',noPublished:'कोई प्रकाशित संस्करण नहीं जुड़ा है।',publish:'Publish',releasePending:'अलग pinned release और owner authorization का कनेक्शन बाकी है।',viewApp:'ऐप खोलें',notificationsBody:'सेवा जुड़ने पर सूचनाओं की पसंद बदल सकेंगे।',savedLogin:'सहेजी गई इनसाइट देखने के लिए लॉगिन करें।',
} satisfies Record<keyof typeof bn,string>
export function ui(locale: Locale) { return {bn,en,hi}[locale] }
export const features = [
  {path:'/dream',key:'dream',body:'dreamBody'}, {path:'/astro',key:'astro',body:'astroBody'},
  {path:'/chat',key:'chat',body:'chatBody'}, {path:'/history',key:'saved',body:'savedBody'},
  {path:'/today',key:'today',body:'todayBody'}, {path:'/settings',key:'settings',body:'settingsBody'},
] as const
