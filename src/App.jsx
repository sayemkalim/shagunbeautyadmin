
import { Toaster } from "sonner"

import Router from './router';


const App = () => {
  return (
    <>
    <Toaster position="top-center" richColors />
    <Router/>
    </>
  );
};

export default App;
