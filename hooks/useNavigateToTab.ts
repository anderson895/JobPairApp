// hooks/useNavigateToTab.ts
import { CommonActions, useNavigation } from '@react-navigation/native';

export const useNavigateToTab = () => {
  const navigation = useNavigation();

  const navigateToTab = (screen: string) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: '(tabs)',
            state: {
              routes: [{ name: screen }],
            },
          },
        ],
      })
    );
  };

  return navigateToTab;
};
