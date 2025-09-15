import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import PostList from './components/Blog/PostList';
import CreatePost from './components/Blog/CreatePost';
import EditPost from './components/Blog/EditPost';
import PostDetail from './components/Blog/PostDetail';
import MyDrafts from './components/Blog/MyDrafts';
import ChatRoom from './components/Chat/ChatRoom';
import FileRepository from './components/Files/FileRepository';
import News from './components/News/News';
import AdminPanel from './components/Admin/AdminPanel';
import CategoryManagement from './components/Admin/CategoryManagement';
import AdminNotifications from './components/Admin/AdminNotifications';
import UserEmailPreferences from './components/Admin/UserEmailPreferences';
import EmailPreferences from './components/User/EmailPreferences';
import AccountManagement from './components/User/AccountManagement';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RedirectRoute from './components/Auth/RedirectRoute';
import { useAuthStore } from './stores/authStore';
import './App.css';

const App: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route 
            path="/blog" 
            element={
              <RedirectRoute>
                <PostList />
              </RedirectRoute>
            } 
          />
          <Route 
            path="/blog/create" 
            element={
              <RedirectRoute>
                <CreatePost />
              </RedirectRoute>
            } 
          />
          <Route 
            path="/blog/:id" 
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blog/:id/edit" 
            element={
              <RedirectRoute>
                <EditPost />
              </RedirectRoute>
            } 
          />
          <Route 
            path="/blog/drafts" 
            element={
              <RedirectRoute>
                <MyDrafts />
              </RedirectRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <RedirectRoute>
                <ChatRoom />
              </RedirectRoute>
            } 
          />
          <Route
            path="/files"
            element={
              <RedirectRoute>
                <FileRepository />
              </RedirectRoute>
            }
          />
          <Route
            path="/news"
            element={
              <RedirectRoute>
                <News />
              </RedirectRoute>
            }
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <CategoryManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/notifications" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminNotifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/user-email-preferences" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserEmailPreferences />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/email-preferences" 
            element={
              <RedirectRoute>
                <EmailPreferences />
              </RedirectRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <RedirectRoute>
                <AccountManagement />
              </RedirectRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;