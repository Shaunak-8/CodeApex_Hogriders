def get_fixtures():
    return [
        """
=================================== FAILURES ===================================
__________________________________ test_add __________________________________
    def test_add():
>       assert add(2, 3) == 6
E       AssertionError: assert 5 == 6

backend/tests/test_math.py:5: AssertionError
        """,
        """
=================================== FAILURES ===================================
_______________________________ test_concat ________________________________
    def test_concat():
>       assert concat("a", 1) == "a1"
E       TypeError: can only concatenate str (not "int") to str

backend/tests/test_strings.py:12: TypeError
        """
    ]
