import subprocess
import json
import os
import functools
from tests.test_helper import TestHelper
from utils import data_utils


def process_image(board):
    process = subprocess.Popen('cd ../; python3 ./process_board.py -i ./dataset/boards/' + board + '.jpg --log error',
                               shell=True, stdout=subprocess.PIPE)
    out, err = process.communicate()
    return json.loads(out.decode('utf-8'))


def evaluate_board(board):
    board_num = ''.join([i for i in board if i.isdigit()])
    image_data = process_image(board_num)
    board_data = json.loads(open('./boards_data/' + board_num + '.json').read())
    match_relations = 0
    match_items = 0
    match_users = 0
    image_users = []

    for relation in image_data['relations']:
        found = elem_found(board_data['relations'], relation['text'])
        if found:
            match_relations += 1

    for item in image_data['items']:
        found = elem_found(board_data['items'], item['text'])
        if found:
            match_items += 1
        for user in item['users']:
            image_users.append(user)

    for user in image_users:
        found = elem_found(board_data['users'], user['text'])
        if found:
            match_users += 1

    print('=========================================')
    print('Board #%s' % board_num)
    print('Relations: Found %d/%d. Matched: %d' % (len(image_data['relations']), len(board_data['relations']), match_relations))
    print('Items: Found %d/%d. Matched: %d' % (len(image_data['items']), len(board_data['items']), match_items))
    print('Users: Found %d/%d. Matched: %d' % (len(image_users), len(board_data['users']), match_users))
    print('=========================================')

    return len(image_data['relations']), len(image_data['items']), len(image_users), len(board_data['relations']),\
           len(board_data['items']), len(board_data['users']), match_relations, match_items, match_users


def elem_found(elements, text):
    for elemText in elements:
        if data_utils.compare_strings(elemText, text) >= 0.7:
            return True
    return False


test = TestHelper()

total_relations = 0
total_items = 0
total_users = 0
found_relations = 0
found_items = 0
found_users = 0
bad_relations = 0
bad_items = 0
bad_users = 0
match_items = 0
match_relations = 0
match_users = 0

boards_perfect_found = []
boards_perfect_match = []


def compare_boards(b1, b2):
    b1_num = ''.join([i for i in b1 if i.isdigit()])
    b2_num = ''.join([i for i in b2 if i.isdigit()])
    if b1_num == '' or b2_num == '':
        return 0
    return int(b1_num) - int(b2_num)

boards = os.listdir('./boards_data')
boards.sort(key=functools.cmp_to_key(compare_boards))
for board in boards:
    if not board.startswith('.'):
        fr, fi, fu, tr, ti, tu, mr, mi, mu = evaluate_board(board)
        if tr == fr and ti == fi:
            boards_perfect_found.append(board)
        if tr == mr and ti == mi:
            boards_perfect_match.append(board)
        total_relations += tr
        total_items += ti
        total_users += tu
        if fr > tr:
            bad_relations += fr - tr
            fr = tr
        if fi > ti:
            bad_items += fi - ti
            fi = ti
        if fu > tu:
            bad_users += fu - tu
            fu = tu
        found_relations += fr
        found_items += fi
        found_users += fu
        match_relations += mr
        match_items += mi
        match_users += mu

found_elems = found_relations + found_items + found_users
match_elems = match_relations + match_items + match_users
total_elems = total_relations + total_items + total_users

print('\nResults:')
print('Relations: Found %d/%d. Matched: %d' % (found_relations, total_relations, match_relations))
print('Items: Found %d/%d. Matched: %d' % (found_items, total_items, match_items))
print('Users: Found %d/%d. Matched: %d' % (found_users, total_users, match_users))
print('Relations Found: %f%%' % ((found_relations / total_relations) * 100))
print('Relations Match: %f%%' % ((match_relations / total_relations) * 100))
print('Items Found: %f%%' % ((found_items / total_items) * 100))
print('Items Match: %f%%' % ((match_items / total_items) * 100))
print('Users Found: %f%%' % ((found_users / total_users) * 100))
print('Users Match: %f%%' % ((match_users / total_users) * 100))
print('Total Found: %f%%' % ((found_elems / total_elems) * 100))
print('Total Match: %f%%' % ((match_elems / total_elems) * 100))

print('\nBoards Perfect Found: %f%%' % ((len(boards_perfect_found) / len(boards)) * 100))
print('Boards Perfect Match: %f%%' % ((len(boards_perfect_match) / len(boards)) * 100))
