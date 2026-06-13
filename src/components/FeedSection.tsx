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
      setErrorMsg(`Ocorreu um erro ao enviar sua publicação: ${err.message || "Verifique sua conexão."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const pathForDelete = `feed/${postId}`;
    try {
      await deleteDoc(doc(db, 'feed', postId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível excluir esta postagem.");
      handleFirestoreError(err, OperationType.DELETE, pathForDelete);
    }
  };

  const handleToggleLike = async (postId: string, currentLikes: string[] = []) => {
    const postRef = doc(db, 'feed', postId);
    const hasLiked = currentLikes.includes(userProfile.uid);
    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(userProfile.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userProfile.uid)
        });
      }
    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const postRef = doc(db, 'feed', postId);
    const newCommentData = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: userProfile.uid,
      userName: userProfile.displayName || 'Usuário',
      text: commentText.trim(),
      createdAt: Date.now()
    };
    
    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newCommentData)
      });
      setCommentText('');
      setCommentingPostId(null);
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  const handleDeleteComment = async (postId: string, comment: any) => {
    if (!confirm("Tem certeza que deseja apagar este comentário?")) return;
    const postRef = doc(db, 'feed', postId);
    try {
      await updateDoc(postRef, {
        comments: arrayRemove(comment)
      });
    } catch (err) {
      console.error("Erro ao remover comentário:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* Dynamic welcome header */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
        <div className="flex gap-4 items-start">
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
            {userProfile.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Feed do Maná</h2>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs flex gap-2">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Post creator form */}
      <form onSubmit={handleSubmit} className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-4">
        <div>
          <textarea
            id="feed_post_textarea"
            rows={3}
            placeholder={`No que você está pensando, ${userProfile.displayName}?`}
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            className="w-full bg-white/5 border border-white/10 placeholder-slate-400 text-white text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-sans"
            maxLength={1000}
          />
        </div>

        {/* Thumbnail preview */}
        {previewUrl && (
          <div id="post_img_preview" className="relative inline-block rounded-xl overflow-hidden border border-white/10 shadow-sm max-w-[240px]">
            <img src={previewUrl} alt="Preview" referrerPolicy="no-referrer" className="max-h-48 object-cover rounded-xl" />
            <button
              type="button"
              id="remove_preview_btn"
              onClick={removeSelectedFile}
              className="absolute top-2 right-2 p-1 bg-red-650/85 hover:bg-red-600 rounded-full text-white cursor-pointer transition-colors"
              title="Remover imagem"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="feed_img_picker_btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-emerald-400 text-xs font-semibold rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Camera size={16} />
              <span>Adicionar Foto</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            id="post_submit_btn"
            disabled={loading || (!msgText.trim() && !selectedFile)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Publicar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Posts Section */}
      <div id="posts_list" className="space-y-4">
        {fetching ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10 space-y-3">
            <Loader2 size={32} className="text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400 uppercase font-bold tracking-wider">Recarregando mural social...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-12 bg-white/5 rounded-3xl border border-white/10 text-slate-400 space-y-2">
            <MessageSquareShare size={40} className="mx-auto opacity-40 text-emerald-400" />
            <p className="font-bold text-slate-300">Nenhuma postagem ainda.</p>
            <p className="text-xs text-slate-450">Seja o primeiro a incentivar o distrito!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isMyPost = post.userId === userProfile.uid;
            return (
              <div 
                key={post.id} 
                className="bg-white/5 rounded-3xl border border-white/10 p-5 hover:border-white/15 transition-all flex flex-col space-y-3 relative group"
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 font-bold rounded-lg flex items-center justify-center select-none text-sm">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm leading-snug">{post.userName}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                          <Church size={10} /> IASD {post.church}
                        </span>
                        <span>•</span>
                        <span>
                          {post.createdAt instanceof Date 
                            ? post.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                            : ''
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deletion button only for owner or admin */}
                  {(isMyPost || userProfile.email === "pedrorafaela_araujo@hotmail.com" || userProfile.email === "prps2013araujo@gmail.com") && (
                    <div className="flex items-center gap-2">
                      {confirmDeleteId === post.id ? (
                        <>
                          <button 
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors font-semibold"
                          >
                            Excluir
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer border border-transparent hover:border-red-500/10"
                          title="Excluir publicação"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Message body */}
                <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">{post.text}</p>

                {/* Post Attachment */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96 mt-2 flex items-center justify-center bg-white/10/40">
                    <img 
                      src={post.imageUrl} 
                      alt="Publicada por usuário" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="max-h-96 w-full object-cover rounded-2xl"
                    />
                  </div>
                )}

                {/* Likes and Comments */}
                <div className="flex items-center gap-4 mt-2 pt-3 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => handleToggleLike(post.id, post.likes)} 
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-md transition-colors cursor-pointer ${post.likes?.includes(userProfile.uid) ? 'text-red-400 bg-red-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Heart size={16} className={post.likes?.includes(userProfile.uid) ? 'fill-current' : ''} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {(post.comments && post.comments.length > 0 || commentingPostId === post.id) && (
                  <div className="mt-3 bg-white/30 rounded-2xl p-4 space-y-3 border border-white/5">
                    {/* Render existing comments */}
                    {post.comments && post.comments.map(comment => (
                      <div key={comment.id} className="flex gap-2 group/comment">
                        <div className="h-6 w-6 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white/5 border border-white/5 rounded-xl rounded-tl-none p-2.5 relative">
                            <span className="text-xs font-bold text-white mb-0.5 block">{comment.userName}</span>
                            <p className="text-xs text-slate-300 break-words">{comment.text}</p>
                            
                            {/* Comment Delete Button */}
                            {(comment.userId === userProfile.uid || userProfile.email === "pedrorafaela_araujo@hotmail.com" || userProfile.email === "prps2013araujo@gmail.com") && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteComment(post.id, comment)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-400 md:opacity-0 md:group-hover/comment:opacity-100 transition-opacity cursor-pointer"
                                title="Apagar comentário"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 ml-1 mt-1 block">
                            {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Comment Input Box */}
                    {commentingPostId === post.id && (
                      <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex items-center gap-2 mt-2 pt-2">
                        <div className="h-7 w-7 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 font-bold flex items-center justify-center text-xs shrink-0">
                          {userProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 placeholder-slate-500 text-white text-xs rounded-xl py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="absolute right-1 top-1.5 p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
