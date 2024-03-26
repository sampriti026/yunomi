import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

const Topbar = ({onPressBuyPremium, signout}) => (
  <View style={{flexDirection: 'row', alignItems: 'center', paddingRight: 20}}>
    <TouchableOpacity onPress={onPressBuyPremium} style={{marginRight: 15}}>
      <Text style={{color: '#fCDDEC', fontWeight: '700'}}>Buy Premium</Text>
    </TouchableOpacity>
    <Menu>
      <MenuTrigger customStyles={{triggerWrapper: {padding: 10}}}>
        <Icon name="ellipsis-v" size={20} color="#FCDDEC" />
      </MenuTrigger>

      <MenuOptions>
        <MenuOption onSelect={signout} text="Sign Out" />
      </MenuOptions>
    </Menu>
  </View>
);

export default Topbar;
