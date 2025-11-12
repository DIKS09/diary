import { 
  FaPen, 
  FaBook, 
  FaHeart, 
  FaStar, 
  FaLightbulb,
  FaFeather,
  FaQuoteLeft,
  FaBookOpen,
  FaScroll,
  FaClock
} from 'react-icons/fa';

import { 
  MdNaturePeople,
  MdWbSunny,
  MdNightlight,
  MdCloud,
  MdLocalFlorist
} from 'react-icons/md';

import {
  IoMdJournal,
  IoMdBook,
  IoMdCreate
} from 'react-icons/io';

import {
  BiPencil,
  BiBookOpen
} from 'react-icons/bi';

// Массив иконок для случайного выбора
export const DIARY_ICONS = [
  { Icon: FaPen, key: 'pen' },
  { Icon: FaBook, key: 'book' },
  { Icon: FaHeart, key: 'heart' },
  { Icon: FaStar, key: 'star' },
  { Icon: FaLightbulb, key: 'lightbulb' },
  { Icon: FaFeather, key: 'feather' },
  { Icon: FaQuoteLeft, key: 'quote' },
  { Icon: FaBookOpen, key: 'bookOpen' },
  { Icon: FaScroll, key: 'scroll' },
  { Icon: FaClock, key: 'clock' },
  { Icon: MdNaturePeople, key: 'nature' },
  { Icon: MdWbSunny, key: 'sunny' },
  { Icon: MdNightlight, key: 'night' },
  { Icon: MdCloud, key: 'cloud' },
  { Icon: MdLocalFlorist, key: 'flower' },
  { Icon: IoMdJournal, key: 'journal' },
  { Icon: IoMdBook, key: 'iobook' },
  { Icon: IoMdCreate, key: 'create' },
  { Icon: BiPencil, key: 'pencil' },
  { Icon: BiBookOpen, key: 'bibookopen' }
];

// Получить иконку по ключу
export const getIconByKey = (iconKey) => {
  const iconObj = DIARY_ICONS.find(item => item.key === iconKey);
  return iconObj ? iconObj.Icon : FaBook;
};

// Получить случайный ключ иконки
export const getRandomIconKey = () => {
  const randomIndex = Math.floor(Math.random() * DIARY_ICONS.length);
  return DIARY_ICONS[randomIndex].key;
};

