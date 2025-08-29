import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  Button,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  SendOutlined,
  AttachFileOutlined,
  EmojiEmotionsOutlined,
  ReplyOutlined,
  MoreVertOutlined,
  SmartToyOutlined
} from '@mui/icons-material';
import { useSpaces } from '../../hooks/useSpaces';
import { useAppSelector } from '../../hooks/redux';

interface SpaceChatProps {
  spaceId: string;
}

export const SpaceChat: React.FC<SpaceChatProps> = ({ spaceId }) => {
  const { currentMessages, sendMessage, reactToMessage } = useSpaces();
  const { user } = useAppSelector((state) => state.auth);
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (message.trim() || attachments.length > 0) {
      await sendMessage('default-thread', message, attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (msg: any) => {
    const isOwn = msg.authorId === user?.id;
    
    return (
      <ListItem
        key={msg.id}
        sx={{
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          py: 1
        }}
      >
        <Box
          sx={{
            maxWidth: '70%',
            bgcolor: isOwn ? 'primary.main' : 'grey.100',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            p: 2,
            mb: 1
          }}
        >
          {!isOwn && (
            <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              {msg.authorId}
            </Typography>
          )}
          <Typography variant="body1">
            {msg.content}
          </Typography>
          
          {msg.mentions?.length > 0 && (
            <Box mt={1}>
              {msg.mentions.map((mention: string) => (
                <Chip key={mention} label={`@${mention}`} size="small" sx={{ mr: 0.5 }} />
              ))}
            </Box>
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </Typography>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages */}
      <Paper sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <List>
          {currentMessages.map(renderMessage)}
          {currentMessages.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Paper>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
          />
          
          <IconButton>
            <AttachFileOutlined />
          </IconButton>
          
          <IconButton>
            <EmojiEmotionsOutlined />
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() && attachments.length === 0}
          >
            <SendOutlined />
          </IconButton>
        </Box>
        
        {attachments.length > 0 && (
          <Box mt={1}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                sx={{ mr: 1 }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
