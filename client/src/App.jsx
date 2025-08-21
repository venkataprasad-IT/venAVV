// import { Routes, Route } from 'react-router-dom';
// import Home from './Pages/Home';
// import Layout from './Pages/Layout'; // ✅ your layout component
// import Dashboard from './Pages/Dashboard';
// import WriteArticle from './Pages/WriteArticle';
// import BlogTitles from './Pages/BlogTitles';
// import GenerateImages from './Pages/GenerateImages';
// import RemoveBackground from './Pages/RemoveBackground';
// import RemoveObject from './Pages/RemoveObject';
// import ReviewResume from './Pages/ReviewResume';
// import Community from './Pages/Community';
// // import { useAuth } from '@clerk/clerk-react';
// // import { useEffect } from 'react';
// import {Toaster} from 'react-hot-toast';
// import "react-toastify/dist/ReactToastify.css";


// const App = () => {

//   // const {getToken} = useAuth()
//   // useEffect(() =>{
//   //   getToken().then((token) =>  console.log(token));
//   // },[])
//   return (
//    <div>
     
//     <Toaster/>
//     <Routes>
//   <Route path='/' element={<Home />} />
//   <Route path='/ai' element={<Layout />}>
//     <Route index element={<Dashboard />} />
//     <Route path='write-article' element={<WriteArticle />} />
//     <Route path='blog-titles' element={<BlogTitles />} />
//     <Route path='generate-images' element={<GenerateImages />} />
//     <Route path='remove-background' element={<RemoveBackground />} />
//     <Route path='remove-object' element={<RemoveObject />} />
//     <Route path='review-resume' element={<ReviewResume />} />
//     <Route path='community' element={<Community />} />
//   </Route>
// </Routes>
//    </div>
//   )
// }

// export default App

import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Layout from "./Pages/Layout";
import Dashboard from "./Pages/Dashboard";
import WriteArticle from "./Pages/WriteArticle";
import BlogTitles from "./Pages/BlogTitles";
import GenerateImages from "./Pages/GenerateImages";
import RemoveBackground from "./Pages/RemoveBackground";
import RemoveObject from "./Pages/RemoveObject";
import ReviewResume from "./Pages/ReviewResume";
import Community from "./Pages/Community";
import { Toaster } from "react-hot-toast"; // ✅ for toast notifications

const App = () => {
  return (
    <div>
      {/* Toast notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* App Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="write-article" element={<WriteArticle />} />
          <Route path="blog-titles" element={<BlogTitles />} />
          <Route path="generate-images" element={<GenerateImages />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="review-resume" element={<ReviewResume />} />
          <Route path="community" element={<Community />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
