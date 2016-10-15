
class TestHelper:
    def __init__(self):
        self.total = 0
        self.match = 0

    def expect_equal(self, a, b):
        if a == b:
            self.match += 1
        self.total += 1

    def get_percentage(self):
        return (self.match * 100) / self.total
