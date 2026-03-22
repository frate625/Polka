# Кнопка записи как в Telegram

## ✅ ЧТО СДЕЛАНО:

### 1. **Создан единый RecordButton**
- Объединяет запись голосовых и кружочков
- Переключение режима быстрым кликом
- Запись долгим нажатием

### 2. **Расположение как в Telegram**
- 📎 (Медиа) - слева
- [Текстовое поле]
- ➤ (Отправить)
- **🎤/⭕ (Запись)** - справа от кнопки отправить

### 3. **Логика взаимодействия**
- **По умолчанию:** 🎤 (голосовое)
- **Быстрый клик (<1 сек):** переключение 🎤 ⇄ ⭕
- **Долгое нажатие (>1 сек):** начинает запись выбранного режима

## 🎯 КАК РАБОТАЕТ:

### Быстрый клик:
```
Клик на 🎤 → меняется на ⭕
Клик на ⭕ → меняется на 🎤
```

### Долгое нажатие:
```
Удерживаем 🎤 > 1 сек → начинается запись голосового
Удерживаем ⭕ > 1 сек → начинается запись кружочка
```

## 📁 СОЗДАННЫЕ/ИЗМЕНЕННЫЕ ФАЙЛЫ:

### 1. **`mobile/src/components/RecordButton.js`** (НОВЫЙ)

Единая кнопка записи с логикой:

**State:**
- `mode` - текущий режим ('voice' или 'video_note')
- `isRecording` - идет ли запись

**Refs:**
- `pressStartTime` - время начала нажатия
- `longPressTimer` - таймер для определения долгого нажатия
- `voicePickerRef` - ссылка на VoicePicker
- `videoNotePickerRef` - ссылка на VideoNotePicker

**Логика:**
```javascript
handlePressIn() {
  // Запускаем таймер на 1 секунду
  longPressTimer = setTimeout(() => {
    startRecording(); // Долгое нажатие
  }, 1000);
}

handlePressOut() {
  const duration = Date.now() - pressStartTime;
  clearTimeout(longPressTimer);
  
  if (duration < 1000 && !isRecording) {
    // Быстрый клик - переключаем режим
    mode = mode === 'voice' ? 'video_note' : 'voice';
  }
}

startRecording() {
  if (mode === 'voice') {
    voicePickerRef.current.startRecording();
  } else {
    videoNotePickerRef.current.startRecording();
  }
}
```

### 2. **`mobile/src/components/VoicePicker.js`**

**Изменения:**
- Обернут в `forwardRef`
- Добавлен `useImperativeHandle` для expose `startRecording`
- Убрана кнопка из JSX (теперь скрытый компонент)
- Добавлен `onCancel` callback
- Добавлен `export default` в конце

```javascript
const VoicePicker = forwardRef(({ onVoiceSelected, onCancel }, ref) => {
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      startRecording();
    }
  }));
  
  // ... остальная логика
  
  const cancelRecording = () => {
    // ...
    if (onCancel) {
      onCancel();
    }
  };
  
  return (
    <Modal ...> {/* БЕЗ кнопки */}
  );
});

export default VoicePicker;
```

### 3. **`mobile/src/components/VideoNotePicker.js`**

Аналогичные изменения как в VoicePicker:
- `forwardRef`
- `useImperativeHandle`
- Убрана кнопка
- Добавлен `onCancel`
- Добавлен `export default`

### 4. **`mobile/src/screens/ChatScreen.js`**

**Импорты:**
```javascript
// Убрано:
// import VideoNotePicker from '../components/VideoNotePicker';
// import VoicePicker from '../components/VoicePicker';

// Добавлено:
import RecordButton from '../components/RecordButton';
```

**JSX:**
```javascript
// Было:
<VoicePicker onVoiceSelected={handleVoiceSelected} />
<VideoNotePicker onVideoNoteSelected={handleVideoNoteSelected} />
<MediaPicker onMediaSelected={handleMediaSelected} />
<TextInput ... />
<TouchableOpacity ...>Отправить</TouchableOpacity>

// Стало:
<MediaPicker onMediaSelected={handleMediaSelected} />
<TextInput ... />
<TouchableOpacity ...>Отправить</TouchableOpacity>
<RecordButton 
  onVoiceSelected={handleVoiceSelected}
  onVideoNoteSelected={handleVideoNoteSelected}
/>
```

## 🚀 КАК ПРОВЕРИТЬ:

### 1. Перезапустите frontend:
```powershell
cd C:\Users\Gamer\chat-app\mobile
npx expo start --web --clear
```

### 2. Панель ввода (слева направо):
```
[📎] [___Текст___] [➤] [🎤]
```

### 3. Проверьте переключение режима:

**Быстрый клик:**
1. Кликните на 🎤
2. Иконка должна смениться на ⭕
3. Кликните на ⭕
4. Иконка должна смениться на 🎤

**В консоли:**
```
🔄 Переключение режима: voice → video_note
🔄 Переключение режима: video_note → voice
```

### 4. Проверьте запись:

**Голосовое:**
1. Удерживайте 🎤 больше 1 секунды
2. Должно открыться окно записи голосового
3. Микрофон с красной точкой
4. Кнопки ✕ и ■

**В консоли:**
```
🔴 Долгое нажатие - начинаем запись voice
```

**Кружочек:**
1. Кликните 🎤 чтобы переключить на ⭕
2. Удерживайте ⭕ больше 1 секунды
3. Должно открыться окно записи кружочка
4. Камера в круге
5. Кнопки ✕ и ■

**В консоли:**
```
🔴 Долгое нажатие - начинаем запись video_note
```

## 💡 ТЕХНИЧЕСКИЕ ДЕТАЛИ:

### Определение долгого нажатия:
```javascript
onPressIn:  setTimeout(..., 1000)  // Запускаем таймер
onPressOut: clearTimeout(...)      // Отменяем если рано отпустили
```

### forwardRef паттерн:
```javascript
const Component = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    method: () => { ... }
  }));
  
  return <View>...</View>;
});

// Использование:
<Component ref={myRef} />
myRef.current.method();
```

## ✨ РЕЗУЛЬТАТ:

### Панель ввода:
```
Было:
[🎤] [⭕] [📎] [___Текст___] [➤]

Стало (как в Telegram):
[📎] [___Текст___] [➤] [🎤/⭕]
```

### Взаимодействие:
- ✅ Быстрый клик = переключение режима
- ✅ Долгое нажатие = запись
- ✅ Один компонент вместо двух
- ✅ Как в Telegram!

---

**ПРОВЕРЯЙТЕ!** 🎉
