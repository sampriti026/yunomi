import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';

const Topbar = ({onPressBuyPremium, signout}) => (
  <View style={{flexDirection: 'row', alignItems: 'center', paddingRight: 20}}>
    <TouchableOpacity onPress={onPressBuyPremium} style={{marginRight: 15}}>
      <Text style={{color: '#fCDDEC', fontWeight: '700'}}>Buy Premium</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={signout} style={{marginRight: 15}}>
      <Text style={{color: '#fCDDEC', fontWeight: '700'}}>Sign Out</Text>
    </TouchableOpacity>
  </View>
);

export default Topbar;
