def get_fixtures():
    return [
        """
=================================== FAILURES ===================================
__________________________________ test_add __________________________________
    def test_add():
>       assert add(2, 3) == 5
E       AssertionError: assert 5 == 5

backend/tests/test_math.py:5: AssertionError
        """,
        """
=================================== FAILURES ===================================
_______________________________ test_concat ________________________________
    def test_concat():
>       assert concat("a", "1") == "a1"
E       AssertionError: assert 'a1' == 'a1'

backend/tests/test_strings.py:12: AssertionError
        """
    ]