import aspectRatio from '@tailwindcss/aspect-ratio'
import containerQueries from '@tailwindcss/container-queries'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'
import { addIconSelectors } from '@iconify/tailwind'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#FF3E00'
				},
				secondary: {
					DEFAULT: '#1B98DE'
				}
			}
		}
	},

	plugins: [typography, forms, containerQueries, aspectRatio, addIconSelectors(['devicon', 'fluent'])]
} satisfies Config
