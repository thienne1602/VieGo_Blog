import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files
import viCommon from '../public/locales/vi/common.json';
import enCommon from '../public/locales/en/common.json';
import zhCommon from '../public/locales/zh/common.json';
import viHome from '../public/locales/vi/home.json';
import enHome from '../public/locales/en/home.json';
import zhHome from '../public/locales/zh/home.json';
import viTours from '../public/locales/vi/tours.json';
import enTours from '../public/locales/en/tours.json';
import zhTours from '../public/locales/zh/tours.json';
import viTourDetail from '../public/locales/vi/tourDetail.json';
import enTourDetail from '../public/locales/en/tourDetail.json';
import zhTourDetail from '../public/locales/zh/tourDetail.json';
import viBlog from '../public/locales/vi/blog.json';
import enBlog from '../public/locales/en/blog.json';
import zhBlog from '../public/locales/zh/blog.json';
import viProfile from '../public/locales/vi/profile.json';
import enProfile from '../public/locales/en/profile.json';
import zhProfile from '../public/locales/zh/profile.json';
import viMessages from '../public/locales/vi/messages.json';
import enMessages from '../public/locales/en/messages.json';
import zhMessages from '../public/locales/zh/messages.json';
import viTourJourney from '../public/locales/vi/tourJourney.json';
import enTourJourney from '../public/locales/en/tourJourney.json';
import zhTourJourney from '../public/locales/zh/tourJourney.json';
import viContact from '../public/locales/vi/contact.json';
import enContact from '../public/locales/en/contact.json';
import zhContact from '../public/locales/zh/contact.json';

// Resources
const resources = {
  vi: {
    common: viCommon,
    home: viHome,
    tours: viTours,
    tourDetail: viTourDetail,
    blog: viBlog,
    profile: viProfile,
    messages: viMessages,
    tourJourney: viTourJourney,
    contact: viContact,
  },
  en: {
    common: enCommon,
    home: enHome,
    tours: enTours,
    tourDetail: enTourDetail,
    blog: enBlog,
    profile: enProfile,
    messages: enMessages,
    tourJourney: enTourJourney,
    contact: enContact,
  },
  zh: {
    common: zhCommon,
    home: zhHome,
    tours: zhTours,
    tourDetail: zhTourDetail,
    blog: zhBlog,
    profile: zhProfile,
    messages: zhMessages,
    tourJourney: zhTourJourney,
    contact: zhContact,
  },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // default language
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
