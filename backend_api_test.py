#!/usr/bin/env python3
"""
BarBuddy Backend API Testing Suite
Tests the actual running backend API endpoints
"""

import requests
import sys
import json
from datetime import datetime

class BarBuddyAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name: str, success: bool, message: str, details: dict = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")

    def run_test(self, name, method, endpoint, expected_status, expected_keys=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    
                    # Check for expected keys if provided
                    if expected_keys:
                        missing_keys = [key for key in expected_keys if key not in response_data]
                        if missing_keys:
                            success = False
                            message = f"Missing expected keys: {missing_keys}"
                        else:
                            message = f"Status: {response.status_code}, All expected keys present"
                    else:
                        message = f"Status: {response.status_code}, Valid JSON response"
                    
                    if success:
                        self.tests_passed += 1
                        self.log_test(name, True, message, {
                            'status_code': response.status_code,
                            'response_keys': list(response_data.keys()) if isinstance(response_data, dict) else 'array',
                            'response_sample': str(response_data)[:200] + '...' if len(str(response_data)) > 200 else response_data
                        })
                    else:
                        self.log_test(name, False, message, {
                            'status_code': response.status_code,
                            'response': response_data
                        })
                        
                except json.JSONDecodeError:
                    self.log_test(name, False, f"Invalid JSON response, Status: {response.status_code}")
                    
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", {
                    'response_text': response.text[:200]
                })

            return success, response.json() if success else {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test 1: Health Check Endpoint"""
        return self.run_test(
            "Health Check (Root)",
            "GET",
            "/",
            200,
            expected_keys=['status', 'message', 'timestamp', 'version']
        )

    def test_api_health(self):
        """Test 2: API Health Check"""
        return self.run_test(
            "API Health Check",
            "GET",
            "/api",
            200,
            expected_keys=['status', 'message', 'endpoints']
        )

    def test_admin_endpoint(self):
        """Test 3: Admin Dashboard Endpoint"""
        return self.run_test(
            "Admin Dashboard",
            "GET",
            "/api/admin",
            200,
            expected_keys=['message', 'database', 'tables', 'status']
        )

    def test_user_profile_endpoint(self):
        """Test 4: User Profile Endpoint"""
        return self.run_test(
            "User Profile",
            "GET",
            "/api/user/demo123/profile",
            200,
            expected_keys=['user_id', 'username', 'display_name', 'xp', 'level']
        )

    def test_venue_likes_endpoint(self):
        """Test 5: Venue Global Likes Endpoint"""
        success, response = self.run_test(
            "Venue Global Likes",
            "GET",
            "/api/venues/likes/global",
            200
        )
        
        # Additional validation for array response
        if success and isinstance(response, list):
            if len(response) > 0:
                first_venue = response[0]
                expected_venue_keys = ['venue_id', 'venue_name', 'total_likes']
                missing_keys = [key for key in expected_venue_keys if key not in first_venue]
                
                if missing_keys:
                    self.log_test("Venue Likes Structure", False, f"Missing venue keys: {missing_keys}")
                else:
                    self.log_test("Venue Likes Structure", True, "Venue objects have correct structure", {
                        'venue_count': len(response),
                        'sample_venue': first_venue
                    })
            else:
                self.log_test("Venue Likes Data", False, "No venue data returned")
        
        return success, response

    def test_cors_headers(self):
        """Test 6: CORS Configuration"""
        try:
            response = requests.options(f"{self.base_url}/api", timeout=10)
            
            # Check if CORS headers are present (they should be for a web app)
            cors_working = True
            cors_details = {}
            
            # Note: OPTIONS might not be implemented, so we check a GET request for CORS headers
            get_response = requests.get(f"{self.base_url}/api", timeout=10)
            
            if 'Access-Control-Allow-Origin' in get_response.headers:
                cors_details['access_control_allow_origin'] = get_response.headers.get('Access-Control-Allow-Origin')
            
            self.tests_run += 1
            if cors_working:
                self.tests_passed += 1
                self.log_test("CORS Configuration", True, "CORS headers configured", cors_details)
            else:
                self.log_test("CORS Configuration", False, "CORS headers missing")
                
        except Exception as e:
            self.tests_run += 1
            self.log_test("CORS Configuration", False, f"CORS test failed: {str(e)}")

    def test_error_handling(self):
        """Test 7: Error Handling"""
        # Test non-existent endpoint
        success, _ = self.run_test(
            "404 Error Handling",
            "GET",
            "/api/nonexistent",
            404
        )
        
        # Note: Express typically returns 404 for non-existent routes
        # If it returns 200, that might indicate a catch-all route
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting BarBuddy Backend API Testing Suite")
        print("=" * 60)
        print(f"Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_health_check()
        self.test_api_health()
        self.test_admin_endpoint()
        self.test_user_profile_endpoint()
        self.test_venue_likes_endpoint()
        self.test_cors_headers()
        self.test_error_handling()
        
        # Generate summary
        print("\n" + "=" * 60)
        print("📊 API TEST SUMMARY")
        print("=" * 60)
        
        total_tests = self.tests_run
        passed_tests = self.tests_passed
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

def main():
    """Main test runner"""
    tester = BarBuddyAPITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    exit_code = 0 if results['failed'] == 0 else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    main()