import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import PostList from './components/Blog/PostList';
import CreatePost from './components/Blog/CreatePost';
import PostDetail from './components/Blog/PostDetail';
import ChatRoom from './components/Chat/ChatRoom';
import FileRepository from './components/Files/FileRepository';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/blog" replace />} />
          <Route path="/blog" element={<PostList />} />
          <Route path="/blog/create" element={<CreatePost />} />
          <Route path="/blog/:id" element={<PostDetail />} />
          <Route path="/chat" element={<ChatRoom />} />
          <Route path="/files" element={<FileRepository />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;