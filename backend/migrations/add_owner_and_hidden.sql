-- Добавляем owner_id в чаты
ALTER TABLE chats ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Добавляем is_hidden в chat_members
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Обновляем существующие групповые чаты: устанавливаем owner_id как первого админа
UPDATE chats 
SET owner_id = (
  SELECT user_id 
  FROM chat_members 
  WHERE chat_members.chat_id = chats.id 
    AND chat_members.role = 'admin' 
  ORDER BY chat_members.joined_at ASC 
  LIMIT 1
)
WHERE type = 'group' AND owner_id IS NULL;
