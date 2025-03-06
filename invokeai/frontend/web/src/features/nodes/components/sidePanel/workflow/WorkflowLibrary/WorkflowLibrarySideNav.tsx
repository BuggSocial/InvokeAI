import type { ButtonProps, CheckboxProps } from '@invoke-ai/ui-library';
import { Button, Checkbox, Flex, Text } from '@invoke-ai/ui-library';
import { useStore } from '@nanostores/react';
import { $workflowCategories } from 'app/store/nanostores/workflowCategories';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { WORKFLOW_TAGS, type WorkflowTag } from 'features/nodes/store/types';
import {
  selectWorkflowLibrarySelectedTags,
  selectWorkflowSelectedCategories,
  workflowSelectedCategoriesChanged,
  workflowSelectedTagsRese,
  workflowSelectedTagToggled,
} from 'features/nodes/store/workflowSlice';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PiArrowCounterClockwiseBold, PiUsersBold } from 'react-icons/pi';
import { useDispatch } from 'react-redux';
import { useGetCountsQuery } from 'services/api/endpoints/workflows';

export const WorkflowLibrarySideNav = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const categories = useAppSelector(selectWorkflowSelectedCategories);
  const categoryOptions = useStore($workflowCategories);
  const selectedTags = useAppSelector(selectWorkflowLibrarySelectedTags);

  const selectYourWorkflows = useCallback(() => {
    dispatch(workflowSelectedCategoriesChanged(categoryOptions.includes('project') ? ['user', 'project'] : ['user']));
  }, [categoryOptions, dispatch]);

  const selectPrivateWorkflows = useCallback(() => {
    dispatch(workflowSelectedCategoriesChanged(['user']));
  }, [dispatch]);

  const selectSharedWorkflows = useCallback(() => {
    dispatch(workflowSelectedCategoriesChanged(['project']));
  }, [dispatch]);

  const selectDefaultWorkflows = useCallback(() => {
    dispatch(workflowSelectedCategoriesChanged(['default']));
  }, [dispatch]);

  const resetTags = useCallback(() => {
    dispatch(workflowSelectedTagsRese());
  }, [dispatch]);

  const isYourWorkflowsSelected = useMemo(() => {
    if (categoryOptions.includes('project')) {
      return categories.includes('user') && categories.includes('project');
    } else {
      return categories.includes('user');
    }
  }, [categoryOptions, categories]);

  const isPrivateWorkflowsExclusivelySelected = useMemo(() => {
    return categories.length === 1 && categories.includes('user');
  }, [categories]);

  const isSharedWorkflowsExclusivelySelected = useMemo(() => {
    return categories.length === 1 && categories.includes('project');
  }, [categories]);

  const isDefaultWorkflowsExclusivelySelected = useMemo(() => {
    return categories.length === 1 && categories.includes('default');
  }, [categories]);

  return (
    <Flex flexDir="column" gap={2} h="full">
      <CategoryButton isSelected={isYourWorkflowsSelected} onClick={selectYourWorkflows}>
        {t('workflows.yourWorkflows')}
      </CategoryButton>
      {categoryOptions.includes('project') && (
        <Flex flexDir="column" gap={2} pl={4}>
          <CategoryButton size="sm" onClick={selectPrivateWorkflows} isSelected={isPrivateWorkflowsExclusivelySelected}>
            {t('workflows.private')}
          </CategoryButton>
          <CategoryButton
            size="sm"
            rightIcon={<PiUsersBold />}
            onClick={selectSharedWorkflows}
            isSelected={isSharedWorkflowsExclusivelySelected}
          >
            {t('workflows.shared')}
          </CategoryButton>
        </Flex>
      )}
      <CategoryButton isSelected={isDefaultWorkflowsExclusivelySelected} onClick={selectDefaultWorkflows}>
        {t('workflows.browseWorkflows')}
      </CategoryButton>

      <Flex flexDir="column" gap={2} pl={4} overflow="hidden">
        <Button
          isDisabled={!isDefaultWorkflowsExclusivelySelected || selectedTags.length === 0}
          onClick={resetTags}
          size="sm"
          variant="link"
          fontWeight="bold"
          justifyContent="flex-start"
          flexGrow={0}
          leftIcon={<PiArrowCounterClockwiseBold />}
          h={8}
        >
          {t('workflows.resetTags')}
        </Button>
        <Flex flexDir="column" gap={2} overflow="auto">
          {WORKFLOW_TAGS.map((tagCategory) => (
            <TagCategory
              key={tagCategory.category}
              tagCategory={tagCategory}
              isDisabled={!isDefaultWorkflowsExclusivelySelected}
            />
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
};

const CategoryButton = memo(({ isSelected, ...rest }: ButtonProps & { isSelected: boolean }) => {
  return (
    <Button
      colorScheme={isSelected ? 'invokeBlue' : 'base'}
      variant="ghost"
      fontWeight="bold"
      justifyContent="flex-start"
      size="md"
      {...rest}
    />
  );
});
CategoryButton.displayName = 'NavButton';

const TagCategory = memo(
  ({ tagCategory, isDisabled }: { tagCategory: (typeof WORKFLOW_TAGS)[number]; isDisabled: boolean }) => {
    const { count } = useGetCountsQuery(
      { tags: [...tagCategory.tags], categories: ['default'] },
      { selectFromResult: ({ data }) => ({ count: data ?? 0 }) }
    );

    if (count === 0) {
      return null;
    }

    return (
      <Flex flexDir="column" gap={2}>
        <Text fontWeight="semibold" color="base.300" opacity={isDisabled ? 0.5 : 1}>
          {tagCategory.category}
        </Text>
        <Flex flexDir="column" gap={2} pl={4}>
          {tagCategory.tags.map((tag) => (
            <TagCheckbox key={tag} tag={tag} isDisabled={isDisabled} />
          ))}
        </Flex>
      </Flex>
    );
  }
);
TagCategory.displayName = 'TagCategory';

const TagCheckbox = memo(({ tag, ...rest }: CheckboxProps & { tag: WorkflowTag }) => {
  const dispatch = useAppDispatch();
  const selectedTags = useAppSelector(selectWorkflowLibrarySelectedTags);
  const isSelected = selectedTags.includes(tag);

  const onChange = useCallback(() => {
    dispatch(workflowSelectedTagToggled(tag));
  }, [dispatch, tag]);

  const { count } = useGetCountsQuery(
    { tags: [tag], categories: ['default'] },
    { selectFromResult: ({ data }) => ({ count: data ?? 0 }) }
  );

  if (count === 0) {
    return null;
  }

  return (
    <Checkbox isChecked={isSelected} onChange={onChange} {...rest}>
      <Text>{`${tag} (${count})`}</Text>
    </Checkbox>
  );
});
TagCheckbox.displayName = 'TagCheckbox';
