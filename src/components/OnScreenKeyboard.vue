<template>
  <transition name="vk-fade">
    <div v-if="visible" class="vk-overlay" @click.self="cancel">
      <div class="vk-container">
        <div class="vk-header">
          <span class="vk-title">On-Screen Keyboard</span>
          <v-btn icon small color="white" @click="cancel">
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="vk-display" :class="{ 'vk-display-password': isPassword }">
          {{ maskedValue }}
        </div>
        <div class="vk-rows">
          <div v-for="(row, rowIndex) in layout" :key="rowIndex" class="vk-row">
            <v-btn
              v-for="key in row"
              :key="key.id"
              class="vk-key"
              :color="key.variant === 'primary' ? 'primary' : 'white'"
              :depressed="key.variant === 'primary'"
              :outlined="key.variant !== 'primary'"
              :x-large="key.wide"
              :class="{
                'vk-key-wide': key.wide,
                'vk-key-icon': key.icon,
                'vk-key-active': key.id === 'shift' && shift
              }"
              @click="pressKey(key)"
            >
              <v-icon v-if="key.icon">{{ key.icon }}</v-icon>
              <span v-else>{{ renderLabel(key.label) }}</span>
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
const BASE_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
  ['clear', 'space', 'enter', 'done']
]

const SPECIAL_KEYS = {
  shift: { id: 'shift', label: 'Shift', variant: 'primary', wide: false },
  backspace: { id: 'backspace', label: 'Back', icon: 'mdi-backspace', wide: false },
  space: { id: 'space', label: 'Space', wide: true },
  clear: { id: 'clear', label: 'Clear', wide: false },
  enter: { id: 'enter', label: 'Enter', wide: false },
  done: { id: 'done', label: 'Done', variant: 'primary', wide: true }
}

const LETTERS = /^[a-z]$/

export default {
  name: 'OnScreenKeyboard',
  data () {
    return {
      visible: false,
      target: null,
      value: '',
      type: 'text',
      shift: false
    }
  },
  computed: {
    layout () {
      return BASE_LAYOUT.map(row => row.map(key => {
        if (SPECIAL_KEYS[key]) {
          return SPECIAL_KEYS[key]
        }
        return {
          id: key,
          label: key,
          wide: false
        }
      }))
    },
    isPassword () {
      return this.type === 'password'
    },
    maskedValue () {
      if (!this.isPassword) {
        return this.value || '\u00A0'
      }
      return this.value ? '•'.repeat(this.value.length) : '\u00A0'
    }
  },
  methods: {
    open (target) {
      if (!target) {
        return
      }
      this.target = target
      this.value = target.value || ''
      this.type = target.type || 'text'
      this.shift = false
      this.visible = true
    },
    cancel () {
      this.visible = false
      this.target = null
      this.value = ''
      this.shift = false
    },
    pressKey (key) {
      if (!key || !this.target) {
        return
      }

      switch (key.id) {
        case 'shift':
          this.shift = !this.shift
          break
        case 'backspace':
          this.value = this.value.slice(0, -1)
          break
        case 'space':
          this.appendValue(' ')
          break
        case 'enter':
          this.appendValue('\n')
          break
        case 'clear':
          this.value = ''
          break
        case 'done':
          this.commit()
          break
        default:
          this.appendValue(this.transformCharacter(key.label))
          if (this.shift && LETTERS.test(key.label)) {
            this.shift = false
          }
      }
    },
    transformCharacter (char) {
      if (this.shift) {
        return char.toUpperCase()
      }
      return char
    },
    appendValue (char) {
      const maxLength = this.target?.getAttribute('maxlength')
      if (maxLength && this.value.length >= Number(maxLength)) {
        return
      }
      this.value = `${this.value}${char}`
    },
    commit () {
      if (!this.target) {
        this.cancel()
        return
      }
      this.setNativeValue(this.target, this.value)
      this.dispatchInput(this.target)
      this.cancel()
    },
    setNativeValue (element, value) {
      if (!element) return

      const tag = element.tagName
      if (tag === 'INPUT') {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        proto?.set?.call(element, value)
      } else if (tag === 'TEXTAREA') {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
        proto?.set?.call(element, value)
      } else {
        element.value = value
      }
    },
    dispatchInput (element) {
      const inputEvent = new Event('input', { bubbles: true })
      element.dispatchEvent(inputEvent)
      const changeEvent = new Event('change', { bubbles: true })
      element.dispatchEvent(changeEvent)
    },
    renderLabel (label) {
      if (label === ' ') {
        return 'Space'
      }
      return this.shift && LETTERS.test(label) ? label.toUpperCase() : label
    }
  }
}
</script>

<style scoped>
.vk-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 22, 43, 0.65);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.vk-container {
  width: clamp(320px, 95vw, 960px);
  background: linear-gradient(180deg, rgba(21, 46, 80, 0.95), rgba(14, 32, 56, 0.95));
  border-radius: 24px 24px 0 0;
  padding: 24px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
  color: white;
}

.vk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.vk-title {
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vk-display {
  min-height: 48px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 18px;
  font-size: 1.2rem;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
}

.vk-display-password {
  font-size: 1.6rem;
  letter-spacing: 0.24em;
}

.vk-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vk-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.vk-key {
  min-width: 52px;
  min-height: 52px;
  font-weight: 600;
  text-transform: uppercase;
}

.vk-key-wide {
  flex: 1;
}

.vk-key-icon {
  text-transform: none;
}

.vk-key-active {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.vk-fade-enter-active,
.vk-fade-leave-active {
  transition: opacity 0.2s ease;
}

.vk-fade-enter,
.vk-fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .vk-container {
    border-radius: 12px 12px 0 0;
    padding: 18px;
  }

  .vk-row {
    gap: 8px;
  }

  .vk-key {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>

