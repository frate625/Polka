# Исправление синтаксической ошибки

## ❌ ПРОБЛЕМА:
```
SyntaxError: Unexpected token, expected "," (228:0)
```

**Причина:** Не закрыт `forwardRef` в компонентах VoicePicker и VideoNotePicker

## ✅ ИСПРАВЛЕНИЕ:

### VoicePicker.js и VideoNotePicker.js

**Было:**
```javascript
const Component = forwardRef((props, ref) => {
  // ...
  return (
    <>
      <Modal ...>
      </Modal>
    </>
  );
}  // <- Не закрыт forwardRef!

const styles = StyleSheet.create({ // <- Ошибка здесь!
```

**Стало:**
```javascript
const Component = forwardRef((props, ref) => {
  // ...
  return (
    <>
      <Modal ...>
      </Modal>
    </>
  );
});  // <- Закрыли forwardRef с });

const styles = StyleSheet.create({  // <- Теперь норм!
```

### Также убраны неиспользуемые стили:
- `button` 
- `buttonText`

Они не нужны, так как кнопки убраны из этих компонентов.

## 📁 ИСПРАВЛЕННЫЕ ФАЙЛЫ:

1. **`mobile/src/components/VoicePicker.js`**
   - Строка 234: `}` → `});`
   - Удалены стили `button` и `buttonText`

2. **`mobile/src/components/VideoNotePicker.js`**
   - Строка 297: `}` → `});`
   - Удалены стили `button` и `buttonText`

## 🚀 ПРОВЕРКА:

```powershell
cd C:\Users\Gamer\chat-app\mobile
npx expo start --web --clear
```

Теперь должно загрузиться без ошибок!

---

**ИСПРАВЛЕНО!** ✅
