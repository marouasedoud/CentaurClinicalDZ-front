import { defineComponent } from 'vue';
import { RouterView } from 'vue-router';
import { Navbar } from '../src';

export const App = defineComponent({
  name: 'App',
  setup() {
    return () => (
      <div class="app-container">
        <Navbar />
        <RouterView />
        <footer class="footer">
          <p>© 2026 Centaur Clinical — Modern Healthcare Auth Portal</p>
        </footer>
      </div>
    );
  },
});

export default App;
