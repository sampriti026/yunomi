import React, {createContext, useState, useContext} from 'react';

const FeedContext = createContext();

export const useFeedContext = () => useContext(FeedContext);

export const FeedProvider = ({children}) => {
  const [swipedPost, setSwipedPost] = useState(null); // Add swipedPost to your context

  const value = {
    swipedPost,
    setSwipedPost, // Allow components to update the swiped post details
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};
