import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '6f102c62f41998d151e5a1b48713cf13';
const API_URL = `https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=20&page=1&api_key=${API_KEY}&format=json&nojsoncallback=1&extras=url_s`;

export default function App() {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [cachedTimestamp, setCachedTimestamp] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedImages');
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        setImages(data);
        setCachedTimestamp(timestamp);
      }
      const response = await fetch(API_URL);
      const responseData = await response.json();
      const newImages = responseData.photos.photo;
      const newTimestamp = Date.now(); // Get current timestamp
      if (!compareImages(images, newImages) || cachedTimestamp !== newTimestamp) {
        setImages(newImages);
        AsyncStorage.setItem('cachedImages', JSON.stringify({ data: newImages, timestamp: newTimestamp }));
        setCachedTimestamp(newTimestamp);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Try to load cached data if available even when offline
      const cachedData = await AsyncStorage.getItem('cachedImages');
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setImages(data);
      } else {
        Alert.alert('Error', 'Failed to fetch images');
      }
    } finally {
      setLoading(false);
    }
  };

  const compareImages = (oldImages, newImages) => {
    if (oldImages.length !== newImages.length) {
      return false;
    }
    for (let i =5 ; i < oldImages.length; i++) {
      if (oldImages[i].id !== newImages[i].id) {
        return false;
      }
    }
    return true;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
        <TouchableOpacity onPress={fetchData}>
          <Text style={{ fontWeight: 'bold', fontSize: 30, padding:10, marginTop:40 }}>Home</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={images}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url_s }}
                style={{ width: 200, height: 200, margin: 5 }}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
