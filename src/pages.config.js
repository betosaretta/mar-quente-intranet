import Admin from './pages/Admin';
import Announcements from './pages/Announcements';
import AnonymousComplaint from './pages/AnonymousComplaint';
import Contacts from './pages/Contacts';
import Contents from './pages/Contents';
import CustomForms from './pages/CustomForms';
import Dashboard from './pages/Dashboard';
import HRDashboard from './pages/HRDashboard';
import HRRequests from './pages/HRRequests';
import Home from './pages/Home';
import Ideas from './pages/Ideas';
import MQNews from './pages/MQNews';
import Manuals from './pages/Manuals';
import Messaging from './pages/Messaging';
import PerformanceReviews from './pages/PerformanceReviews';
import Recognition from './pages/Recognition';
import RecruitmentKanban from './pages/RecruitmentKanban';
import Suggestions from './pages/Suggestions';
import Tickets from './pages/Tickets';
import VacationManagement from './pages/VacationManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Announcements": Announcements,
    "AnonymousComplaint": AnonymousComplaint,
    "Contacts": Contacts,
    "Contents": Contents,
    "CustomForms": CustomForms,
    "Dashboard": Dashboard,
    "HRDashboard": HRDashboard,
    "HRRequests": HRRequests,
    "Home": Home,
    "Ideas": Ideas,
    "MQNews": MQNews,
    "Manuals": Manuals,
    "Messaging": Messaging,
    "PerformanceReviews": PerformanceReviews,
    "Recognition": Recognition,
    "RecruitmentKanban": RecruitmentKanban,
    "Suggestions": Suggestions,
    "Tickets": Tickets,
    "VacationManagement": VacationManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};