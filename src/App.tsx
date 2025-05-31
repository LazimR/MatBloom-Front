import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/Store';

import Header from './components/header/Header';
import Login from './pages/login/Login';
import Home from './pages/home/Home';
import './css/App.css';

function App() {
  return (
		<Provider store={store}>	
			<Router>
				<Header />
				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/ds/*" element={<Home/>} />
				</Routes>
			</Router>
		</Provider>
  );
}

export default App;