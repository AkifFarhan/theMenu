import { Outlet, Route, Routes } from 'react-router';
import BaseLayout from './views/BaseLayout';
import Home from './views/Home';
import Inventory from './views/Inventory';
import AddFood from './views/AddFood';
import Recipes from './views/Recipes';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { Toaster } from 'react-hot-toast';
import Sessions from './views/Sessions';

function App() {
  return (
    <>
      <Routes>
        <Route
          element={
            <BaseLayout>
              <Outlet />
            </BaseLayout>
          }
        >
          <Route path={'/'} element={<Home />} />
          <Route path={'/inventory'} element={<Inventory />} />
          <Route path={'/add-food'} element={<AddFood />} />
          <Route path={'/recipes'} element={<Recipes />} />
          <Route path={'/sessions'} element={<Sessions />} />
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          error: {
            duration: 5000,
          },
        }}
      />
    </>
  );
}

export default App;
