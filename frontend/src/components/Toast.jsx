import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
        type === 'success' 
          ? 'bg-green-500/20 border-green-500/50 text-green-400' 
          : 'bg-red-500/20 border-red-500/50 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-70">
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
