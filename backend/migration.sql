-- Миграция для добавления reply_to_id и voice типа

-- 1. Добавить колонку reply_to_id
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID;

-- 2. Добавить foreign key constraint
ALTER TABLE messages 
ADD CONSTRAINT fk_reply_to 
FOREIGN KEY (reply_to_id) 
REFERENCES messages(id) 
ON DELETE SET NULL;

-- 3. Добавить voice в ENUM (если еще нет)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'voice' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_messages_type')
    ) THEN
        ALTER TYPE enum_messages_type ADD VALUE 'voice';
    END IF;
END$$;

-- Проверка
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'reply_to_id';
