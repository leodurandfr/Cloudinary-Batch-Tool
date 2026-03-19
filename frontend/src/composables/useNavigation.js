import { ref } from 'vue'

const activeTab = ref('galerie')

export function useNavigation() {
  return { activeTab }
}
