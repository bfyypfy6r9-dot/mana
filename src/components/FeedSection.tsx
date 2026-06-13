import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, FeedPost } from '../types';
import { 
  Heart, 
  Image as ImageIcon, 
  Send, 
  User, 
  Church, 
  Trash2, 
  Loader2, 
  MessageSquareShare,
  MessageCircle,
  Sparkles,
  Camera,
  X
} from 'lucide-react';

interface FeedSectionProps {
  userProfile: UserProfile;
}

export default function FeedSection({ userProfile }: FeedSectionProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [msgText, setMsgText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load feed posts in real-time
  useEffect(() => {
    setFetching(true);
    const pathForList = 'feed';
    const q = query(collection(db, 'feed'), orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsList: FeedPost[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        postsList.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          church: data.church,
          text: data.text,
          imageUrl: data.imageUrl,
          likes: data.likes || [],
          comments: data.comments || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        } as FeedPost);
      });
      setPosts(postsList);
      setFetching(false);
    }, (error) => {
      console.error(error);
      setFetching(false);
      handleFirestoreError(error, OperationType.LIST, pathForList);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() && !selectedFile) return;

    setLoading(true);
    setErrorMsg(null);
    let finalImageUrl = '';

    try {
      // 1. Process image file if selected using ImgBB API
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('image', selectedFile);
          
          // Chave do ImgBB inserida diretamente aqui
          const imgbbKey = "7a40c04d86d6369c3e11d863610a223c";

          const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
            method: 'POST',
            body: formData
          });
          
          const data = await response.json();
          if (data.success) {
            finalImageUrl = data.data.url;
          } else {
            throw new Error(data.error?.message || "Falha ao processar o upload da imagem.");
          }
        } catch (uploadErr: any) {
          console.error("Erro no upload da imagem:", uploadErr);
          throw new Error(`${uploadErr.message}`);
        }
      }

      // 2. Write Post into Firestore
      const pathForCreate = 'feed';
      await addDoc(collection(db, 'feed'), {
        userId: userProfile.uid,
        userName: userProfile.displayName || 'Membro da Igreja',
        church: userProfile.church || 'Guajiru',
        text: msgText.trim() || '',
        imageUrl: finalImageUrl || '',
        createdAt: serverTimestamp()
      });

      // 3. Clear form inputs on success
      setMsgText('');
      removeSelectedFile();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Ocorreu um erro ao enviar sua publicação: ${err.message || "Ver
