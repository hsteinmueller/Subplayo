import {defineConfig} from 'rolldown';

export default defineConfig({
  input: 'src/main.js',
  output: {
    file: 'build/bundle.js',
    format: 'cjs',
  },
});
