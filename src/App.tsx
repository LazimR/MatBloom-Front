import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';

import Header from './components/header/Header';
import Login from './pages/login/Login';
import './App.css';

function App() {
  return (
		<Provider store={store}>	
			<Router>
				<Header />
				<Routes>
					<Route path="/" element={<Login />} />
				</Routes>
			</Router>
		</Provider>
  );
}

export default App;