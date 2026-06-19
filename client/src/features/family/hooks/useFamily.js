import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';

export const useChildren = () => {
  return useQuery({
    queryKey: ['family', 'children'],
    queryFn: familyApi.getChildren,
  });
};

export const useCreateChild = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: familyApi.createChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
    },
  });
};

export const useUpdateChildRestrictions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, restrictionsData }) => 
      familyApi.updateChildRestrictions(childId, restrictionsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
      // If you need to invalidate specific child's details query later, you can add it here.
    },
  });
};

export const useChangeChildPassword = () => {
  return useMutation({
    mutationFn: ({ childId, passwordData }) =>
      familyApi.changeChildPassword(childId, passwordData),
  });
};

export const useDeleteChild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId) => familyApi.deleteChildAccount(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
    },
  });
};
