import hashlib
import base64







def find_keys_with_multiple_values(data):
    # 创建字典，记录每个键的所有值
    multi_value_dict = {}
    for key, value in data:
        if key in multi_value_dict:
            if value not in multi_value_dict[key]:  # 避免重复值
                multi_value_dict[key].append(value)
        else:
            multi_value_dict[key] = [value]

    # 判断是否有键对应多个值
    for key, values in multi_value_dict.items():
        if len(values) > 1:
            return True

# 可以重复
def letterCombinations(phoneMap: dict):  # TODO
    """
    print(letterCombinations({0: list(range(1,3)), 1: list(range(1,3)), 2: list(range(1,3))}))
    [[1, 1, 1], [1, 1, 2], [1, 2, 1], [1, 2, 2], [2, 1, 1], [2, 1, 2], [2, 2, 1], [2, 2, 2]]
    """
    def dfs(index, combination):
        # 第一步，设置停止条件，一般和深度有关，这里的深度是index
        if index == len(digits):
            combinations.append(combination)
            return
        # 第二步，确定要迭代的对象，这里是每个数字对应的letter
        letter_str = phoneMap[digits[index]]
        # 第三步，循环
        for letter in letter_str:
            # 第四步，主要的更新逻辑，更新深度和目标
            new_combination = combination + [letter]
            new_index = index + 1
            # 第五步，递归
            dfs(new_index, new_combination)

    digits = list(phoneMap.keys())
    combinations = []
    dfs(0, [])
    return combinations

# 可以重复
def uniqueletterCombinations(phoneMap: dict):  # TODO
    """
    print(letterCombinations({0: list(range(1,4)), 1: list(range(1,4)), 2: list(range(1,4))}))
    [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
    """
    def dfs(index, combination):
        # 第一步，设置停止条件，一般和深度有关，这里的深度是index
        if index == len(digits):
            combinations.append(combination)
            return
        # 第二步，确定要迭代的对象，这里是每个数字对应的letter
        letter_str = phoneMap[digits[index]]
        # 第三步，循环
        for letter in letter_str:
            if letter in combination:continue
            # 第四步，主要的更新逻辑，更新深度和目标
            new_combination = combination + [letter]
            new_index = index + 1
            # 第五步，递归
            dfs(new_index, new_combination)

    digits = list(phoneMap.keys())
    combinations = []
    dfs(0, [])
    return combinations


# 全排列
def permutations(nums: list, depth=None):

    """
    print(permutations([0,1,2], 3))
    [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
    """
    if not depth:
        depth = len(nums)
    if len(nums) < depth:
        return
    def dfs(index, combination, used):
        if index == depth:
            combinations.append(combination)
            return
        for i in range(len(nums)):
            if not used[i]:
                used[i] = True
                new_combination = combination + [nums[i]]
                new_index = index + 1 # 只用于停止条件判断深度
                dfs(new_index, new_combination, used)
                used[i] = False
    used = [False for _ in range(len(nums))]
    combinations = []
    dfs(0, [], used)
    return combinations

def string_to_unique_id(input_string):
    # 使用SHA-256哈希算法
    hash_object = hashlib.sha256(input_string.encode())
    # 获取哈希值
    hash_bytes = hash_object.digest()
    # 使用base64编码缩短哈希值
    unique_id = base64.urlsafe_b64encode(hash_bytes).rstrip(b'=').decode('utf-8')
    return unique_id

# 示例用法
# input_string = "example_string"
# unique_id = string_to_unique_id(input_string)
# print(unique_id)
if __name__ == "__main__":
    import inspect

    # print(len(letterCombinations({0: list(range(25)), 1: list(range(25)), 2: list(range(25)), 3: list(range(25))})))
    print(letterCombinations({0: list(range(1,3)), 1: list(range(1,3)), 2: list(range(1,3))}))
    print(uniqueletterCombinations({0: list(range(1,4)), 1: list(range(1,4)), 2: list(range(1,4))}))
    print(uniqueletterCombinations({0: list(range(1,2))}))
    # result = llm_response(prompt="你好", use_gpt=False)
    # print(result)
    # result = llm_response(prompt="你好", use_gpt=True)
    # print(len(permutations([0,1,2,4,5,6,7,8,9], 4)))
    # print(len(permutations([0,1,2,4,5,6,7,8], 4)))
    # print(len(permutations([0,1,2,4,5,6,7], 4)))
    # print(len(permutations([0,1,2,4,5,6], 4)))
    # print(len(permutations([0,1,2,4,5], 4)))
    print(permutations([0,1,2]))

